"""
Adaptive Rate Limiter for Sahibinden Crawler
=============================================
Cloudflare ve bot detection'dan kaçınmak için akıllı bekleme sistemi.

Özellikler:
- Exponential backoff on block
- Jitter (rastgele varyasyon)
- Request tracking
- Adaptive delay based on response time
"""

import time
import random
import logging
from collections import deque
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class RateLimiterConfig:
    """Rate limiter konfigürasyonu - ULTRA HIZ MODU (3-4 saniye/sayfa)"""
    base_delay: float = 0.5          # Temel bekleme süresi (1.5 -> 0.5)
    min_delay: float = 0.1           # Minimum bekleme (0.5 -> 0.1)
    max_delay: float = 4.0           # Maksimum bekleme (30.0 -> 4.0)
    jitter_range: float = 0.3        # Rastgele varyasyon aralığı (0.5 -> 0.3)
    backoff_multiplier: float = 1.5  # Block sonrası çarpan (2.0 -> 1.5)
    max_backoff_level: int = 3       # Maksimum backoff seviyesi (25 -> 3)
    cooldown_after_block: float = 10.0  # Block sonrası soğuma süresi (60.0 -> 10.0)
    requests_per_minute: int = 100   # Dakikada maksimum istek (55 -> 100)
    burst_limit: int = 50            # Ardışık hızlı istek limiti (25 -> 50)


class AdaptiveRateLimiter:
    """
    Akıllı rate limiter.
    
    Kullanım:
        limiter = AdaptiveRateLimiter()
        
        for url in urls:
            limiter.wait()  # Bekleme
            response = fetch(url)
            
            if is_blocked(response):
                limiter.report_blocked()
            else:
                limiter.report_success()
    """
    
    def __init__(self, config: Optional[RateLimiterConfig] = None):
        self.config = config or RateLimiterConfig()
        self.backoff_level = 0
        self.last_request_time: Optional[float] = None
        self.last_block_time: Optional[float] = None
        self.request_times: deque = deque(maxlen=100)
        self.consecutive_successes = 0
        self.total_requests = 0
        self.total_blocks = 0
        self.burst_count = 0
        self.last_burst_reset = time.time()
    
    def _calculate_delay(self) -> float:
        """Mevcut duruma göre bekleme süresini hesapla"""
        base = self.config.base_delay
        
        # Backoff uygula
        if self.backoff_level > 0:
            base *= (self.config.backoff_multiplier ** self.backoff_level)
        
        # Başarılı isteklerden sonra yavaşça azalt
        if self.consecutive_successes > 10:
            reduction = min(0.3, self.consecutive_successes * 0.02)
            base *= (1 - reduction)
        
        # Jitter ekle
        jitter = random.uniform(-self.config.jitter_range, self.config.jitter_range)
        delay = base + jitter
        
        # Sınırlar içinde tut
        return max(self.config.min_delay, min(self.config.max_delay, delay))
    
    def _check_burst_limit(self) -> bool:
        """Burst limit kontrolü"""
        now = time.time()
        
        # Her dakika burst sayacını sıfırla
        if now - self.last_burst_reset > 60:
            self.burst_count = 0
            self.last_burst_reset = now
        
        return self.burst_count < self.config.burst_limit
    
    def _check_rate_limit(self) -> bool:
        """Dakikalık rate limit kontrolü"""
        now = time.time()
        minute_ago = now - 60
        
        # Son 1 dakikadaki istekleri say
        recent_requests = sum(1 for t in self.request_times if t > minute_ago)
        
        return recent_requests < self.config.requests_per_minute
    
    def wait(self) -> float:
        """
        Sonraki istek için bekle - ULTRA HIZ MODU (minimal bekleme)
        
        Returns:
            Beklenen süre (saniye)
        """
        # Block sonrası soğuma kontrolü (sadece block varsa)
        if self.last_block_time:
            time_since_block = time.time() - self.last_block_time
            if time_since_block < self.config.cooldown_after_block:
                extra_wait = self.config.cooldown_after_block - time_since_block
                logger.info(f"⏳ Block sonrası soğuma: {extra_wait:.1f}s")
                time.sleep(extra_wait)
        
        # Rate limit kontrolü (sadece aşılırsa bekle)
        while not self._check_rate_limit():
            logger.debug("Rate limit aşıldı, bekleniyor...")
            time.sleep(2)  # 5s -> 2s
        
        # ULTRA HIZ: Delay hesaplama YOK, direkt geç!
        # Sadece kayıt tut
        self.last_request_time = time.time()
        self.request_times.append(self.last_request_time)
        self.total_requests += 1
        self.burst_count += 1
        
        return 0  # Hiç bekleme!
    
    def report_success(self):
        """Başarılı istek bildir"""
        self.consecutive_successes += 1
        
        # Backoff'u yavaşça azalt
        if self.consecutive_successes >= 5 and self.backoff_level > 0:
            self.backoff_level = max(0, self.backoff_level - 1)
            logger.info(f"✅ Backoff azaltıldı: {self.backoff_level}")
    
    def report_blocked(self):
        """Block/ban bildir"""
        self.total_blocks += 1
        self.consecutive_successes = 0
        self.last_block_time = time.time()
        
        # Backoff seviyesini artır
        self.backoff_level = min(
            self.config.max_backoff_level,
            self.backoff_level + 1
        )
        
        new_delay = self._calculate_delay()
        logger.warning(
            f"🚫 Block algılandı! Backoff: {self.backoff_level}, "
            f"Yeni delay: {new_delay:.1f}s"
        )
    
    def report_slow_response(self, response_time: float):
        """Yavaş yanıt bildir (sunucu yükü göstergesi)"""
        if response_time > 10:  # 10 saniyeden uzun
            self.backoff_level = min(
                self.config.max_backoff_level,
                self.backoff_level + 0.5
            )
            logger.info(f"🐢 Yavaş yanıt ({response_time:.1f}s), delay artırıldı")
    
    def get_stats(self) -> dict:
        """İstatistikleri döndür"""
        return {
            "total_requests": self.total_requests,
            "total_blocks": self.total_blocks,
            "block_rate": (self.total_blocks / self.total_requests * 100) if self.total_requests > 0 else 0,
            "current_backoff_level": self.backoff_level,
            "current_delay": self._calculate_delay(),
            "consecutive_successes": self.consecutive_successes,
        }
    
    def reset(self):
        """Limiter'ı sıfırla"""
        self.backoff_level = 0
        self.consecutive_successes = 0
        self.last_block_time = None
        self.burst_count = 0
        logger.info("🔄 Rate limiter sıfırlandı")


class ProxyRotator:
    """
    Proxy rotasyonu yöneticisi.
    
    Kullanım:
        rotator = ProxyRotator([
            "http://proxy1:8080",
            "http://proxy2:8080",
        ])
        
        proxy = rotator.get_next()
        # ... kullan ...
        
        if failed:
            rotator.mark_failed(proxy)
    """
    
    def __init__(self, proxies: list[str]):
        self.proxies = proxies
        self.current_index = 0
        self.failed_proxies: dict[str, datetime] = {}
        self.proxy_stats: dict[str, dict] = {
            p: {"success": 0, "fail": 0} for p in proxies
        }
        self.cooldown_minutes = 30
    
    def get_next(self) -> Optional[str]:
        """Sonraki kullanılabilir proxy'yi döndür"""
        if not self.proxies:
            return None
        
        now = datetime.now()
        available = []
        
        for proxy in self.proxies:
            # Cooldown kontrolü
            if proxy in self.failed_proxies:
                fail_time = self.failed_proxies[proxy]
                if now - fail_time < timedelta(minutes=self.cooldown_minutes):
                    continue
                else:
                    # Cooldown bitti, tekrar dene
                    del self.failed_proxies[proxy]
            
            available.append(proxy)
        
        if not available:
            # Tüm proxy'ler cooldown'da, en az başarısız olanı seç
            logger.warning("⚠️ Tüm proxy'ler cooldown'da!")
            self.failed_proxies.clear()
            available = self.proxies
        
        # Round-robin
        proxy = available[self.current_index % len(available)]
        self.current_index += 1
        
        return proxy
    
    def mark_success(self, proxy: str):
        """Başarılı kullanım bildir"""
        if proxy in self.proxy_stats:
            self.proxy_stats[proxy]["success"] += 1
        
        # Başarılı olunca failed listesinden çıkar
        if proxy in self.failed_proxies:
            del self.failed_proxies[proxy]
    
    def mark_failed(self, proxy: str):
        """Başarısız kullanım bildir"""
        if proxy in self.proxy_stats:
            self.proxy_stats[proxy]["fail"] += 1
        
        self.failed_proxies[proxy] = datetime.now()
        logger.warning(f"🚫 Proxy başarısız: {proxy}")
    
    def get_stats(self) -> dict:
        """Proxy istatistiklerini döndür"""
        return {
            "total_proxies": len(self.proxies),
            "available": len(self.proxies) - len(self.failed_proxies),
            "failed": len(self.failed_proxies),
            "stats": self.proxy_stats,
        }


# Singleton instance
_rate_limiter: Optional[AdaptiveRateLimiter] = None

def get_rate_limiter() -> AdaptiveRateLimiter:
    """Global rate limiter instance"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = AdaptiveRateLimiter()
    return _rate_limiter

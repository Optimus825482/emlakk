/**
 * E-posta Gönderme Step'leri
 * DEMİR-NET Workflow DevKit
 */

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: EmailParams) {
  "use step";

  const {
    to,
    subject,
    html,
    from = "DEMİR Gayrimenkul <noreply@demirgayrimenkul.com>",
  } = params;

  // TODO: Resend veya başka bir email servisi entegre edilecek
  // Şimdilik console.log ile simüle ediyoruz
  console.log(`📧 E-posta gönderiliyor:
    Kime: ${to}
    Konu: ${subject}
    Gönderen: ${from}
  `);

  // Simüle edilmiş başarılı yanıt
  return {
    success: true,
    messageId: `msg_${Date.now()}`,
    to,
    subject,
  };
}

export async function sendWelcomeEmail(email: string, name: string) {
  "use step";

  return sendEmail({
    to: email,
    subject: "DEMİR Gayrimenkul'e Hoş Geldiniz!",
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>DEMİR Gayrimenkul ailesine hoş geldiniz.</p>
      <p>Hendek ve çevresindeki en iyi gayrimenkul fırsatları için doğru adrestesiniz.</p>
      <p>Sorularınız için bize ulaşmaktan çekinmeyin.</p>
      <br/>
      <p>Saygılarımızla,<br/>DEMİR Gayrimenkul Ekibi</p>
    `,
  });
}

export async function sendAppointmentReminder(
  email: string,
  name: string,
  appointmentDate: string,
  propertyTitle: string
) {
  "use step";

  return sendEmail({
    to: email,
    subject: `Randevu Hatırlatması: ${propertyTitle}`,
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>Yarınki randevunuzu hatırlatmak istiyoruz:</p>
      <ul>
        <li><strong>Tarih:</strong> ${appointmentDate}</li>
        <li><strong>İlan:</strong> ${propertyTitle}</li>
      </ul>
      <p>Görüşmek üzere!</p>
      <br/>
      <p>DEMİR Gayrimenkul</p>
    `,
  });
}

export async function sendValuationResult(
  email: string,
  name: string,
  propertyType: string,
  estimatedValue: string
) {
  "use step";

  return sendEmail({
    to: email,
    subject: "Değerleme Sonucunuz Hazır!",
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>Gayrimenkul değerleme talebiniz tamamlandı.</p>
      <ul>
        <li><strong>Gayrimenkul Tipi:</strong> ${propertyType}</li>
        <li><strong>Tahmini Değer:</strong> ${estimatedValue}</li>
      </ul>
      <p>Detaylı rapor için bizimle iletişime geçebilirsiniz.</p>
      <br/>
      <p>DEMİR Gayrimenkul</p>
    `,
  });
}

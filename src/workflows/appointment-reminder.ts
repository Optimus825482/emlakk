/**
 * Randevu Hatırlatma Workflow'u
 * DEMİR-NET Workflow DevKit
 *
 * Randevu oluşturulduğunda:
 * 1. Onay e-postası gönder
 * 2. 1 gün önce hatırlatma gönder
 * 3. 1 saat önce son hatırlatma gönder
 */

import { sleep } from "workflow";
import { getAppointment, updateAppointmentStatus } from "./steps/database";
import { sendEmail } from "./steps/email";

export async function appointmentReminderWorkflow(appointmentId: string) {
  "use workflow";

  // 1. Randevu bilgilerini al
  const appointment = await getAppointment(appointmentId);

  if (!appointment) {
    console.log(`Randevu bulunamadı: ${appointmentId}`);
    return { success: false, reason: "appointment_not_found" };
  }

  const { name, email, phone, date, time, listingId } = appointment;
  const formattedDate = `${date} ${time}`;

  // 2. Onay e-postası gönder
  await sendEmail({
    to: email,
    subject: "Randevunuz Onaylandı - DEMİR Gayrimenkul",
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>Randevunuz başarıyla oluşturuldu.</p>
      <p><strong>Tarih:</strong> ${formattedDate}</p>
      <p>Görüşmek üzere!</p>
      <br/>
      <p>DEMİR Gayrimenkul</p>
    `,
  });

  console.log(`✅ Randevu onay e-postası gönderildi: ${email}`);

  // 3. Randevu tarihine kadar bekle (1 gün önce hatırlatma için)
  const appointmentTime = new Date(`${date}T${time}`).getTime();
  const oneDayBefore = appointmentTime - 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (oneDayBefore > now) {
    const waitTime = oneDayBefore - now;
    console.log(
      `⏳ 1 gün öncesi hatırlatma için bekleniyor: ${Math.round(
        waitTime / 1000 / 60 / 60
      )} saat`
    );
    await sleep(waitTime);

    // 1 gün önce hatırlatma
    await sendEmail({
      to: email,
      subject: "Yarın Randevunuz Var! - DEMİR Gayrimenkul",
      html: `
        <h1>Merhaba ${name}!</h1>
        <p>Yarınki randevunuzu hatırlatmak istiyoruz.</p>
        <p><strong>Tarih:</strong> ${formattedDate}</p>
        <p>Görüşmek üzere!</p>
        <br/>
        <p>DEMİR Gayrimenkul</p>
      `,
    });

    console.log(`✅ 1 gün önce hatırlatma gönderildi: ${email}`);
  }

  // 4. 1 saat önce son hatırlatma
  const oneHourBefore = appointmentTime - 60 * 60 * 1000;
  const nowAfterFirstWait = Date.now();

  if (oneHourBefore > nowAfterFirstWait) {
    const waitTime = oneHourBefore - nowAfterFirstWait;
    console.log(
      `⏳ 1 saat öncesi hatırlatma için bekleniyor: ${Math.round(
        waitTime / 1000 / 60
      )} dakika`
    );
    await sleep(waitTime);

    // 1 saat önce hatırlatma
    await sendEmail({
      to: email,
      subject: "1 Saat Sonra Randevunuz Var! - DEMİR Gayrimenkul",
      html: `
        <h1>Merhaba ${name}!</h1>
        <p>Randevunuza 1 saat kaldı!</p>
        <p><strong>Tarih:</strong> ${formattedDate}</p>
        <p>Sizi bekliyoruz!</p>
        <br/>
        <p>DEMİR Gayrimenkul</p>
      `,
    });

    console.log(`✅ 1 saat önce hatırlatma gönderildi: ${email}`);
  }

  return {
    success: true,
    appointmentId,
    email,
    appointmentDate: formattedDate,
  };
}

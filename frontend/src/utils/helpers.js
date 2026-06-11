// Telefonu 0 532 123 45 67 formatına çevir
export function formatTelefon(tel) {
  if (!tel) return '—';
  const sayilar = String(tel).replace(/\D/g, '');
  if (sayilar.length === 11 && sayilar.startsWith('0')) return `0 ${sayilar.slice(1, 4)} ${sayilar.slice(4, 7)} ${sayilar.slice(7, 9)} ${sayilar.slice(9, 11)}`;
  if (sayilar.length === 10) return `0 ${sayilar.slice(0, 3)} ${sayilar.slice(3, 6)} ${sayilar.slice(6, 8)} ${sayilar.slice(8, 10)}`;
  return tel;
}

// Telefon numarasını input'ta formatlamak için
export function formatPhoneInput(value) {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.length > 0 && !digits.startsWith('0')) digits = '0' + digits;
  digits = digits.slice(0, 11);
  let res = '';
  if (digits.length > 0) res += digits.substring(0, 1);
  if (digits.length > 1) res += ' ' + digits.substring(1, 4);
  if (digits.length > 4) res += ' ' + digits.substring(4, 7);
  if (digits.length > 7) res += ' ' + digits.substring(7, 9);
  if (digits.length > 9) res += ' ' + digits.substring(9, 11);
  return res;
}

// WhatsApp ve API işlemleri için temiz telefon numarası (905321234567)
export function getCleanPhoneNumber(phone) {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) return `90${digitsOnly.substring(1)}`;
  if (digitsOnly.length === 10) return `90${digitsOnly}`;
  return digitsOnly;
}

export function formatPara(tutar) {
  if (tutar == null) return '0,00 TL';
  return `${Number(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

export function formatTarih(t) {
  if (!t) return '—';
  return new Date(t).toLocaleDateString('tr-TR');
}

// Ad/Soyad'ı Title Case yap (Ahmet Yılmaz)
export function capitalize(text) {
  if (!text) return '';
  return text.toLocaleLowerCase('tr-TR').split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)).join(' ');
}
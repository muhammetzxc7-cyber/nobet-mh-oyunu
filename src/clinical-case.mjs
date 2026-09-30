// Customer-approved wording. Keep these texts intact when extending the course.
export const patient = {
  name: 'Derya K.', age: '42', sex: 'Kadın', weight: '68 kg',
  operation: 'Elektif laparoskopik histerektomi', asa: 'II', allergy: 'Yok', anesthesiaHistory: 'Yok',
};
export const familyHistory = 'Babam yıllar önce bir ameliyat sırasında çok yüksek ateş nedeniyle yoğun bakıma alınmış. Ailem bunun anesteziyle ilgili olduğunu söylemişti fakat tam olarak ne olduğunu bilmiyorum.';
export const question = 'Bu aile öyküsü karşısında ne yaparsın?';
export const options = [
  { id: 'A', text: 'Hasta daha önce böyle bir durum yaşamadığı için aile öyküsünü dikkate almam.', hint: 'Malign hipertermi genetik yatkınlıkla ilişkilidir. Kişi daha önce hiçbir belirti yaşamamış olsa bile ailede anestezi sırasında ciddi reaksiyon öyküsü önemli olabilir.', title: 'Yanlış karar', explanation: 'Hasta daha önce belirti yaşamamış olabilir. Babasının anestezi sırasındaki ciddi reaksiyonu MH yatkınlığı açısından önemlidir.' },
  { id: 'B', text: 'Bu öykünün malign hipertermi yatkınlığı açısından önemli olabileceğini düşünür ve anestezi ekibine bildiririm.', hint: 'Malign hipertermi genetik yatkınlıkla ilişkilidir. Kişi daha önce hiçbir belirti yaşamamış olsa bile ailede anestezi sırasında ciddi reaksiyon öyküsü önemli olabilir.', title: 'DOĞRU KARAR', explanation: 'Aile öyküsündeki önemli bilgiyi fark ettin ve anestezi ekibiyle paylaştın.' },
  { id: 'C', text: 'Bu bilgiyi yalnızca hastanın ameliyat öncesi stres değerlendirmesinde dikkate alırım.', hint: 'Malign hipertermi genetik yatkınlıkla ilişkilidir. Kişi daha önce hiçbir belirti yaşamamış olsa bile ailede anestezi sırasında ciddi reaksiyon öyküsü önemli olabilir.', title: 'Yanlış karar', explanation: 'Bu öykü yalnızca stres hakkında değildir; ailedeki anestezi reaksiyonu MH yatkınlığına işaret edebilir.' },
];
export const learning = {
  title: 'MALİGN HİPERTERMİ NEDİR?',
  paragraphs: ['Malign hipertermi, genetik yatkınlığı bulunan kişilerde bazı anestezik ajanlarla tetiklenebilen ciddi bir reaksiyondur. Hastanın kendi anestezi öyküsü kadar aile öyküsü de önemlidir.'],
  reminder: 'Genetik yatkınlık + tetikleyici ajan → MH krizi gelişebilir.',
};
export const scoreRules = [
  ['İlk denemede doğru', 10], ['İlk yanlış ve ipucu sonrası doğru', 6], ['2 veya daha fazla yanlış sonrası doğru', 4],
];
export const observationBeats = [
  { title: 'Hastayı karşıla', text: 'Derya K. ameliyathanede. Henüz anestezi indüksiyonu öncesindedir.', view: 'patient' },
  { title: 'Monitörü gözlemle', text: 'Hasta monitöre bağlı; nabız ve oksijen satürasyonu izleniyor. ETCO₂ ölçümü henüz başlatılmadı.', view: 'equipment' },
  { title: 'Öyküyü hatırla', text: 'Dosyadaki aile öyküsü dikkatini çekiyor: babasında anestezi sırasında açıklanamayan ciddi bir reaksiyon yaşanmış.', view: 'room' },
];
export const preopVitals = { hr: 78, co2: 0, temp: 36.7, spo2: 99, systolic: 122, diastolic: 76, rr: 16 };

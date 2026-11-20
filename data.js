/* Kolahak demo catalogue: original products, sample prices in toman */
window.KOLAHAK = {
  sizes: [
    { id: '0-6m', fa: '۰ تا ۶ ماه', en: '0–6 months', cm: [36, 42] },
    { id: '6-12m', fa: '۶ تا ۱۲ ماه', en: '6–12 months', cm: [42, 46] },
    { id: '1-2y', fa: '۱ تا ۲ سال', en: '1–2 years', cm: [46, 48] },
    { id: '2-4y', fa: '۲ تا ۴ سال', en: '2–4 years', cm: [48, 50] },
    { id: '4-8y', fa: '۴ تا ۸ سال', en: '4–8 years', cm: [50, 52] },
    { id: '8-12y', fa: '۸ تا ۱۲ سال', en: '8–12 years', cm: [52, 54] }
  ],
  categories: [
    { id: 'knit', fa: 'بافتنی', en: 'Knits' },
    { id: 'bucket', fa: 'باکت', en: 'Bucket hats' },
    { id: 'sun', fa: 'آفتابی', en: 'Sun hats' },
    { id: 'cap', fa: 'کپ', en: 'Caps' }
  ],
  products: [
    { id: 'pompom', model: 'beanie', cat: 'knit', season: 'winter', price: 690000, sizes: ['6-12m', '1-2y', '2-4y', '4-8y'], badge: 'best', yaw: -0.55,
      fa: { name: 'بافت پوم‌پوم ابری', short: 'بافت نرم با پوم‌پوم پفکی که دوبار دوخته شده', desc: 'کلاه بافتنی گرم با لبهٔ دوبل که روی گوش‌ها می‌نشیند. پوم‌پوم با دوخت دوبل به کلاه وصل شده و با شست‌وشو نمی‌ریزد.', material: '۵۰٪ پشم مرینو، ۵۰٪ پنبه' },
      en: { name: 'Cloud Pompom Beanie', short: 'Soft knit with a fluffy, double-stitched pompom', desc: 'A warm knit beanie with a double-layer cuff that covers the ears. The pompom is double-stitched in place, so it stays on wash after wash.', material: '50% merino wool, 50% cotton' },
      colors: [
        { id: 'blush', fa: 'گلبهی', en: 'Blush', main: '#E7A6A1', second: '#F6ECDF', env: '#FBE3DF' },
        { id: 'oat', fa: 'جودوسری', en: 'Oat', main: '#D8C6AC', second: '#FBF6EE', env: '#F3EBDD' },
        { id: 'sky', fa: 'آسمانی', en: 'Sky', main: '#9DBCE3', second: '#FBF6EE', env: '#E2ECFA' },
        { id: 'sage', fa: 'مریم‌گلی', en: 'Sage', main: '#9DB89F', second: '#F6ECDF', env: '#E3EFE4' }
      ] },
    { id: 'teddy', model: 'bear', cat: 'knit', season: 'winter', price: 740000, sizes: ['0-6m', '6-12m', '1-2y', '2-4y'], badge: 'new', yaw: -0.4,
      fa: { name: 'بافت خرسی گوش‌دار', short: 'گوش‌های کوچک خرسی، لبهٔ کش‌باف نرم', desc: 'محبوب‌ترین کلاه برای نوزادها. گوش‌های خرسی پر از الیاف نرم هستند و لبهٔ کش‌باف کلاه را بدون فشار روی سر نگه می‌دارد.', material: '۷۰٪ پنبهٔ ارگانیک، ۳۰٪ پشم مرینو' },
      en: { name: 'Teddy Ear Beanie', short: 'Little bear ears and a soft ribbed cuff', desc: 'Our most loved hat for babies. The bear ears are softly filled, and the ribbed cuff holds the hat in place without pressing on the head.', material: '70% organic cotton, 30% merino wool' },
      colors: [
        { id: 'honey', fa: 'عسلی', en: 'Honey', main: '#C9A57E', second: '#F3E6D3', env: '#F4E9DA' },
        { id: 'cocoa', fa: 'کاکائویی', en: 'Cocoa', main: '#8A6650', second: '#E9D5BF', env: '#EFE2D6' },
        { id: 'cream', fa: 'شیری', en: 'Cream', main: '#EDE3D2', second: '#D9B9A0', env: '#F4EEE4' }
      ] },
    { id: 'fisher', model: 'fisherman', cat: 'knit', season: 'winter', price: 590000, sizes: ['1-2y', '2-4y', '4-8y', '8-12y'], yaw: -0.5,
      fa: { name: 'بافت ماهیگیری رنگین', short: 'کش‌باف کامل با لبهٔ برگردان پهن', desc: 'کلاه کوتاه کش‌باف که با لبهٔ برگردان پهن، اندازه‌اش با رشد بچه قابل تنظیم است. برای مدرسه و بازی بیرون.', material: '۱۰۰٪ اکریلیک ضدحساسیت' },
      en: { name: 'Little Fisherman Beanie', short: 'All-over rib with a wide fold-up cuff', desc: 'A short ribbed beanie with a wide fold-up cuff, so the fit grows with your child. Made for school runs and playground days.', material: '100% hypoallergenic acrylic' },
      colors: [
        { id: 'mustard', fa: 'خردلی', en: 'Mustard', main: '#E2A93B', second: '#F6ECDF', env: '#FFF0CC' },
        { id: 'tomato', fa: 'گوجه‌ای', en: 'Tomato', main: '#D9573F', second: '#F6ECDF', env: '#FCE2DA' },
        { id: 'navy', fa: 'سرمه‌ای', en: 'Navy', main: '#2F3E6B', second: '#F6ECDF', env: '#DFE5F5' }
      ] },
    { id: 'sailor', model: 'striped', cat: 'knit', season: 'winter', price: 720000, sizes: ['1-2y', '2-4y', '4-8y'], yaw: -0.6,
      fa: { name: 'بافت راه‌راه ملوانی', short: 'راه‌راه پهن کلاسیک با پوم‌پوم شیری', desc: 'طرح ملوانی همیشگی با راه‌های پهن که در هر عکسی زیبا دیده می‌شود. داخل کلاه آستر نرم دارد تا پیشانی را نخاراند.', material: '۶۰٪ پنبه، ۴۰٪ پشم مرینو' },
      en: { name: 'Sailor Stripe Beanie', short: 'Classic wide stripes and a cream pompom', desc: 'A timeless sailor stripe that looks good in every photo. Lined with soft cotton inside, so it never itches the forehead.', material: '60% cotton, 40% merino wool' },
      colors: [
        { id: 'navy', fa: 'سرمه‌ای و شیری', en: 'Navy & cream', main: '#2F3E6B', second: '#F4EEE3', env: '#DDE6FA' },
        { id: 'red', fa: 'قرمز و شیری', en: 'Red & cream', main: '#C8463A', second: '#F4EEE3', env: '#FBE1DC' },
        { id: 'forest', fa: 'جنگلی و شیری', en: 'Forest & cream', main: '#3F6B57', second: '#F4EEE3', env: '#DCECE3' }
      ] },
    { id: 'dotty', model: 'bucket', cat: 'bucket', season: 'summer', price: 640000, sizes: ['6-12m', '1-2y', '2-4y', '4-8y'], badge: 'best', yaw: -0.5, pitch: 0.42,
      fa: { name: 'باکت خال‌خالی دورو', short: 'دو کلاه در یکی: یک رو خال‌خالی، یک رو ساده', desc: 'کلاه باکت پنبه‌ای که هر دو رویش قابل استفاده است. لبهٔ دورتادور با دوخت‌های موازی فرم خودش را نگه می‌دارد و صورت را از آفتاب حفظ می‌کند.', material: '۱۰۰٪ پنبهٔ ارگانیک' },
      en: { name: 'Reversible Dotty Bucket', short: 'Two hats in one: dotty on one side, plain on the other', desc: 'A cotton bucket hat you can wear either way. Rows of stitching keep the brim in shape and shade the face from the sun.', material: '100% organic cotton' },
      colors: [
        { id: 'lemon', fa: 'لیمویی خال‌دار', en: 'Lemon dots', main: '#F1D06A', second: '#FFFFFF', env: '#FFF3C6', pattern: 2 },
        { id: 'rose', fa: 'صورتی خال‌دار', en: 'Rose dots', main: '#F0A6B4', second: '#FFFFFF', env: '#FDE5EA', pattern: 2 },
        { id: 'sage', fa: 'مریم‌گلی ساده', en: 'Plain sage', main: '#8FB9A8', second: '#FFFFFF', env: '#E4F1EA', pattern: 0 }
      ] },
    { id: 'sunny', model: 'sunhat', cat: 'sun', season: 'summer', price: 890000, sizes: ['1-2y', '2-4y', '4-8y', '8-12y'], badge: 'new', yaw: -1.75, pitch: 0.36,
      fa: { name: 'آفتابی حصیری لبه‌پهن', short: 'حصیر بافت دست با روبان پاپیونی', desc: 'کلاه حصیری سبک با لبهٔ ۸ سانتی که صورت و گردن را در سایه نگه می‌دارد. روبان پاپیونی دوخته شده و جدا نمی‌شود.', material: 'حصیر کاغذی بافت دست، روبان پنبه‌ای' },
      en: { name: 'Wide-Brim Straw Sun Hat', short: 'Hand-woven straw with a ribbon bow', desc: 'A light straw hat with an 8 cm brim that keeps face and neck in the shade. The ribbon bow is sewn on and won’t come loose.', material: 'Hand-woven paper straw, cotton ribbon' },
      colors: [
        { id: 'sage', fa: 'روبان سبز', en: 'Sage ribbon', main: '#E4CB98', second: '#7FA58E', env: '#E6F1E8' },
        { id: 'rose', fa: 'روبان صورتی', en: 'Rose ribbon', main: '#E4CB98', second: '#E58FA0', env: '#FCE7EB' },
        { id: 'navy', fa: 'روبان سرمه‌ای', en: 'Navy ribbon', main: '#E4CB98', second: '#2F3E6B', env: '#E3E9F6' }
      ] },
    { id: 'minicap', model: 'cap', cat: 'cap', season: 'all', price: 560000, sizes: ['2-4y', '4-8y', '8-12y'], yaw: 0.75,
      fa: { name: 'کپ شش‌ترک کودک', short: 'نقاب منحنی، زیر نقاب رنگی', desc: 'کپ پنبه‌ای شش‌ترک با سوراخ‌های تهویه و نقاب منحنی. زیر نقاب رنگ متضاد دارد و بند پشت کلاه قابل تنظیم است.', material: '۱۰۰٪ پنبهٔ کجراه (توئیل)' },
      en: { name: 'Mini Six-Panel Cap', short: 'Curved visor with a contrast underside', desc: 'A six-panel cotton cap with air eyelets and a curved visor. The underside of the visor comes in a contrast colour, and the back strap adjusts.', material: '100% cotton twill' },
      colors: [
        { id: 'coral', fa: 'مرجانی', en: 'Coral', main: '#E46B5A', second: '#2F3E6B', env: '#FDE4DE' },
        { id: 'navy', fa: 'سرمه‌ای', en: 'Navy', main: '#2F3E6B', second: '#E46B5A', env: '#E2E8F6' },
        { id: 'sky', fa: 'آسمانی', en: 'Sky', main: '#9CC3EA', second: '#2F3E6B', env: '#E2EDFB' }
      ] }
  ]
};

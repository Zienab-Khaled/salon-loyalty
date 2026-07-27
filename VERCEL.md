# رفع المشروع على Vercel — خطوات مهمة

## 1) Root Directory
Settings → General → Root Directory = `web`

## 2) قاعدة البيانات (ضروري عشان البطاقة ما تختفي)
على Vercel البيانات ما تنحفظ في الملفات العادية.
لازم تضيف **Upstash Redis** مجاناً:

1. افتح مشروعك في Vercel
2. تبويب **Storage** → **Create Database** → **Upstash Redis**
3. اربطه بالمشروع (Connect)
4. هيتضاف تلقائياً:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. **Redeploy**

## 3) متغيرات إضافية
Settings → Environment Variables:

- `STAFF_PIN` = رمز لوحة الصالون (مثل `1234`)
- `NEXT_PUBLIC_SITE_URL` = `https://salon-loyalty-upuq.vercel.app` (رابط موقعك)

ثم Redeploy مرة ثانية.

# 🚀 NEXUS (POULS) Taşıma ve Kurulum Rehberi (Migration Guide)

Projeyi yeni bir AI Studio hesabına / asistanına taşıdığınızda tüm yapılandırmaların ve uçtan uca Supabase (SQL) kurulumunun kaybolmaması için aşağıdaki adımları izleyin:

## 1. Ortam Değişkenleri (Environment Variables)
Yeni AI Studio projenizi (veya deploy ettiğiniz ortamı) açtığınızda **Ayarlar (Settings)** menüsüne giderek aşağıdaki değişkenleri girin. Gerekli altyapıyı sağlamak için boş bir Supabase projesi oluşturmanız yeterlidir.

- `GEMINI_API_KEY`: API anahtarınız
- `VITE_SUPABASE_URL`: Supabase Proje URL'niz (Frontend ve Backend erişimi için)
- `VITE_SUPABASE_ANON_KEY`: Supabase anon public anahtarınız 
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Admin yetkisi gerektiren durumlar için (Backend'de)

*(Detayları `.env.example` dosyasında görebilirsiniz.)*

## 2. SQL Backend Migrasyonu (Veritabanını Yeniden Oluşturma)
Mevcut tüm veritabanı şemalarınız (Kullanıcılar, Risk Profilleri, Sinyal Logları, Trade Geçmişi vb.) AI Studio asistanı ile projeyi kopyaladığınızda **klasörlerinizle birlikte taşınmıştır.** 

Yeni hesabınızda veritabanını boot etmek için **Terminal üzerinden veya yeni ajanla iletişim kurarak** şu migrations (göç) dosyalarını Supabase'e basın:
Tüm şemalar `supabase/migrations/` klasörü altındadır.

**Ajan'a verebileceğiniz komut:**
> *"Yeni projeyi açtım, lütfen supabase/migrations/ klasöründeki tüm SQL şemalarını mevcut supabase veritabanıma push'la veya bana db_execute aracı ile oluşturmamda yardımcı ol."*

Ya da manuel olarak:
- SQL tabloları: `20260426000000_dataclaw_init.sql` ve `20260426000001_dataclaw_tables2.sql` içindedir. Bunları Supabase portalınızdaki "SQL Editor" üzerine yapıştırıp çalıştırarak tüm arka planı anında ayağa kaldırabilirsiniz. (Hiçbir şema kaybolmamıştır!)

## 3. Sistem Sağlığı ve AI Ajan Tanımları
Proje klasörüne yüklenen **`AGENTS.md`** sayesinde yeni AI Studio asistanınız, bu projenin bir "AI-insan sosyal medya platformu" (NEXUS/POULS) olduğunu, hangi ajanların (`openclaw`, `mirofish`, `betafish`, `onyx`) çalıştığını doğrudan hatırlayacaktır. Ekstra promt yazmanıza gerek kalmaz.

`server.ts` içinde CrewAI simülasyonu ve PolicyGuard (%70 confidence threshold) yapılandırmanız da korunmaktadır.

---
**Özetle:** Proje "Export to GitHub" veya AI Studio üzerinden "Remix / Share" yapılarak başka bir hesaba aktarıldığında **tüm backend kodunuz, SQL tablolarınız ve Ajan mantığınız (AGENTS.md) korunur**. Sadece yeni hesabınızın Supabase Key'lerini ve Gemini anahtarını tanımlamanız yeterlidir.

import { Link } from "wouter"
import { Phone, Mail, MapPin, Clock } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-primary/5 pt-20 pb-10 border-t border-primary/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="space-y-6">
            <img 
              src="/assets/kholoud-lab-logo.png" 
              alt="مختبر خلود للتحاليل الطبية | Kholoud Lab" 
              className="h-14 w-auto object-contain"
            />
            <p className="text-muted-foreground leading-relaxed text-sm">
              شريكك الموثوق للرعاية الصحية والتشخيص الدقيق. نقدم خدمات التحاليل الطبية الشاملة بأحدث التقنيات لضمان صحتك وصحة عائلتك.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-foreground">روابط سريعة</h4>
            <ul className="space-y-4">
              <li><a href="#services" className="text-muted-foreground hover:text-primary transition-colors">خدماتنا الطبية</a></li>
              <li><a href="#packages" className="text-muted-foreground hover:text-primary transition-colors">باقات الفحص الشامل</a></li>
              <li><a href="#results" className="text-muted-foreground hover:text-primary transition-colors">استعلام عن النتائج</a></li>
              <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">عن المختبر</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-foreground">معلومات التواصل</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-sm">الرياض، المملكة العربية السعودية<br/>طريق الملك فهد، حي الملقا</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground font-en text-sm" dir="ltr">055 907 0400</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground font-en text-sm" dir="ltr">info@kholoudlab.sa</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-foreground">ساعات العمل</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-muted-foreground text-sm">
                  <p className="font-medium text-foreground mb-1">السبت - الخميس</p>
                  <p>8:00 صباحاً - 10:00 مساءً</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted/0 mt-0.5 shrink-0" />
                <div className="text-muted-foreground text-sm">
                  <p className="font-medium text-foreground mb-1">الجمعة</p>
                  <p>4:00 عصراً - 10:00 مساءً</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-primary/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} مختبر خلود للتحاليل الطبية. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">الشروط والأحكام</a>
            <span>•</span>
            <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

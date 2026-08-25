import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardContent className="pt-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            الصفحة غير موجودة
          </h1>
          
          <p className="text-muted-foreground mb-8">
            نعتذر، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد يكون الرابط خاطئاً أو تم نقل الصفحة.
          </p>
          
          <Button asChild className="rounded-full gap-2 w-full">
            <Link href="/">
              <ArrowRight className="h-4 w-4" />
              العودة للصفحة الرئيسية
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

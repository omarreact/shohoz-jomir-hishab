import { t } from "@/src/locales";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function NewsletterCta() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden text-dark" style={{ backgroundColor: "var(--bs-primary)" }}>
      <CardBody className="p-4 p-md-5 text-center">
        <h3 className="fw-bold mb-3">{t.newsletter.title}</h3>
        <p className="mb-4 opacity-75 mx-auto text-dark" style={{ maxWidth: "500px" }}>
          {t.newsletter.subtitle}
        </p>
        <form className="d-flex flex-column flex-sm-row gap-2 justify-content-center mx-auto" style={{ maxWidth: "400px" }}>
          <div className="flex-grow-1">
            <Input 
              type="email" 
              placeholder={t.newsletter.placeholder} 
              required
              className="mb-0"
              style={{ height: "50px", borderRadius: "50px" }}
            />
          </div>
          <Button type="submit" variant="dark" className="rounded-pill px-4 fw-bold" style={{ height: "50px" }}>
            {t.newsletter.button}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

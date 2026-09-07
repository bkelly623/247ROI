import { permanentRedirect } from "next/navigation";

export default function TermsRedirectPage() {
  permanentRedirect("/terms-of-service");
}

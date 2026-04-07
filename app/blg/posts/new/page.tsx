import { redirect } from "next/navigation";

export default function BlogNewPostRedirectPage() {
  redirect("/admin/blg/posts/new");
}

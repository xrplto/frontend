import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TrustsetRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (router.query.slug) {
      router.replace(`/token/${router.query.slug}/trustset`);
    }
  }, [router]);

  return null;
}

export async function getServerSideProps(ctx) {
  const slug = ctx.params.slug;

  return {
    redirect: {
      destination: `/token/${slug}/trustset`,
      permanent: true
    }
  };
}

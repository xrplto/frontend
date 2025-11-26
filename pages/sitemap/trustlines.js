import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { performance } from 'perf_hooks';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const BASE_URL = 'https://api.xrpl.to/api';

const Sitemap = ({ tokens, slug }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const totalCount = tokens.length;
  const perPage = 300;
  const pageCount = Math.ceil(totalCount / perPage);

  const [page, setPage] = useState(1);
  const [slugs, setSlugs] = useState(tokens);

  const capitalizedText = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleChangePage = (event, newPage) => {
    if (page === newPage) return;

    setPage(newPage);
    gotoTop(event);
  };

  const gotoTop = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  useEffect(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pSlugs = tokens.slice(startIndex, endIndex);

    setSlugs(pSlugs);
  }, [page]);

  return (
    <div className="flex-1 overflow-hidden">
      <div id="back-to-top-anchor" className="h-16" />
      <Header />

      <div className="mx-auto max-w-7xl px-4">
        <h1 className={cn("mt-4 text-3xl font-normal", isDark ? "text-white" : "text-gray-900")}>
          {`${capitalizedText(slug)} Trustline Sitemap`}
        </h1>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {slugs.map((token) => {
            return (
              <div
                key={token}
                className="overflow-hidden text-ellipsis p-[5px]"
              >
                <a
                  href={`/trustset/${token}`}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className={cn(
                    "text-[15px] no-underline hover:text-gray-400",
                    isDark ? "text-[#007B55]" : "text-[#147DFE]"
                  )}
                >
                  {capitalizedText(token)}
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex justify-center">
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={(e) => handleChangePage(e, pageNum)}
                className={cn(
                  "rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal",
                  page === pageNum
                    ? "border-primary bg-primary text-white"
                    : isDark
                    ? "border-gray-700 hover:border-primary hover:bg-primary/5"
                    : "border-gray-300 hover:bg-gray-100"
                )}
              >
                {pageNum}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <a
            href="/sitemap/tokens"
            rel="noreferrer noopener nofollow"
            className={cn(
              "text-[15px] no-underline hover:text-gray-400",
              isDark ? "text-[#007B55]" : "text-[#147DFE]"
            )}
          >
            Tokens Sitemap
          </a>
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
};

export const getServerSideProps = async (ctx) => {
  let slugs = [];
  let exch = null;
  let H24 = null;
  let global = null;
  let count = 0;
  let total = 0;
  const time = new Date().toISOString();

  const { slug } = { slug: 'token' };

  try {
    var t1 = performance.now();

    const res = await axios.get(`${BASE_URL}/slugs`);

    count = res.data?.count;
    slugs = res.data?.slugs;
    exch = res.data?.exch;
    total = res.data?.total;
    H24 = res.data?.H24;
    global = res.data?.global;

    var t2 = performance.now();
    var dt = (t2 - t1).toFixed(2);

    let ogp = {};

    ogp.canonical = 'https://xrpl.to';
    ogp.title = slug.charAt(0).toUpperCase() + slug.substr(1) + ' Trustline Sitemap';
    ogp.url = 'https://xrpl.to/';
    ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
    ogp.desc =
      "Navigate XRPL tokens easily with XRPL.to's Token Trustlines Sitemap – a user-friendly guide for managing your trustlines and exploring new tokens!";

    return {
      props: {
        tokens: slugs,
        slug,
        data: {
          exch,
          total,
          H24,
          global
        },
        ogp
      }
    };
  } catch (e) {
    return {
      props: {
        tokens: [],
        slug: '',
        data: {
          exch,
          total,
          H24,
          global
        }
      }
    };
  }
};

export default Sitemap;

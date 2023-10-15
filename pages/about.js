import React from 'react';
import { Box, Container, Grid, Toolbar, Typography, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import axios from 'axios';
import { performance } from 'perf_hooks';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { useRouter } from "next/router";

function AboutPage() {
  const router = useRouter();
  return (
    <Box>
  <Toolbar id="back-to-top-anchor" />
  <Topbar />
  <Header />

  <Container maxWidth="xl">
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h1" sx={{ my: 4 }}>
          {router.locale === 'en' ? 'About xrpl.to Tokens' : router.locale === 'es' ? 'Acerca de xrpl.to Fichas' : 'About xrpl.to Tokens'}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="body1">
            <b>
              {router.locale === 'en' ? 'At XRPL.to, we are the largest price-tracking onchain app for tokenized assets on the XRPL ecosystem. Our mission is to make XRPL tokens discoverable and efficient globally by empowering retail users with unbiased, high-quality, and accurate information. With a commitment to becoming the premier online source for XRP Ledger market data, we strive to provide all the relevant and current information on XRPL tokens, currencies, and assets in a single, easy-to-find location. Our goal is to empower users to draw their own informed conclusions by offering them unbiased and accurate data for making informed decisions.' : router.locale === 'es' ? 'En XRPL.to, somos la aplicación más grande de seguimiento de precios en cadena para activos tokenizados en el ecosistema XRPL. Nuestra misión es hacer que los tokens XRPL sean descubribles y eficientes a nivel global, empoderando a los usuarios minoristas con información imparcial, de alta calidad y precisa. Con un compromiso de convertirse en la principal fuente en línea de datos de mercado de XRP Ledger, nos esforzamos por proporcionar toda la información relevante y actual sobre tokens, monedas y activos XRPL en un solo lugar de fácil acceso. Nuestro objetivo es capacitar a los usuarios para que saquen sus propias conclusiones informadas ofreciéndoles datos imparciales y precisos para tomar decisiones informadas.' : 'About xrpl.to Tokens'}
            </b>
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="body1">
            {router.locale === 'en' ? 'Founded in November 2021 by NFT Labs, XRPL.to is a dedicated platform providing up-to-date XRPL token prices, charts, and data specifically for the emerging XRPL DEX markets. Our commitment lies in delivering accurate, timely, and unbiased information, sourced directly from the XRP Ledger itself. Our efforts have been recognized and acknowledged by reputable media publications, including Bloomberg, New York Times, and Digital Trends. We take pride in being a trusted source for comprehensive XRPL market insights, enabling users to stay informed and make informed decisions.' : router.locale === 'es' ? 'Fundada en noviembre de 2021 por NFT Labs, XRPL.to es una plataforma dedicada que proporciona precios, gráficos y datos actualizados de tokens XRPL específicamente para los mercados emergentes XRPL DEX. Nuestro compromiso radica en proporcionar información precisa, oportuna e imparcial, obtenida directamente del propio XRP Ledger. Nuestros esfuerzos han sido reconocidos y destacados por publicaciones de medios de reputación, como Bloomberg, New York Times y Digital Trends. Nos enorgullece ser una fuente confiable de información integral sobre el mercado XRPL, lo que permite a los usuarios mantenerse informados y tomar decisiones informadas.' : 'About xrpl.to Tokens'}
          </Typography>
        </Box>

        <Box>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'November 2021 Tokens' : router.locale === 'es' ? 'Fichas de noviembre de 2021' : 'November 2021 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'XRPL.to Launches Tokens' : router.locale === 'es' ? 'Lanzamiento de XRPL.to Fichas' : 'XRPL.to Launches Tokens'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'December 2021 Tokens' : router.locale === 'es' ? 'Fichas de diciembre de 2021' : 'December 2021 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'xrpl.to concludes the year with a monthly page view count of 55,000 Tokens' : router.locale === 'es' ? 'xrpl.to concluye el año con un recuento mensual de visitas de 55,000 Fichas' : 'xrpl.to concludes the year with a monthly page view count of 55,000 Tokens'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'July 2022 Tokens' : router.locale === 'es' ? 'Fichas de julio de 2022' : 'July 2022 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'XRPL Grants Wave 3 Recipient Tokens' : router.locale === 'es' ? 'Receptor de XRPL Grants Wave 3 Fichas' : 'XRPL Grants Wave 3 Recipient Tokens'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'August 2022 Tokens' : router.locale === 'es' ? 'Fichas de agosto de 2022' : 'August 2022 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'On-Ramp Fiat Integration Tokens' : router.locale === 'es' ? 'Integración de On-Ramp Fiat Fichas' : 'On-Ramp Fiat Integration Tokens'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'October 2022 Tokens' : router.locale === 'es' ? 'Fichas de octubre de 2022' : 'October 2022 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'XRPL.to introduces a weighted market cap for tokens with low liquidity Tokens' : router.locale === 'es' ? 'XRPL.to introduce una capitalización de mercado ponderada para fichas con baja liquidez Fichas' : 'XRPL.to introduces a weighted market cap for tokens with low liquidity Tokens'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'February 2023 Tokens' : router.locale === 'es' ? 'Fichas de febrero de 2023' : 'February 2023 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'Full XRPL History Implemented Tokens' : router.locale === 'es' ? 'Implementación de la Historia Completa de XRPL Fichas' : 'Full XRPL History Implemented Tokens'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {router.locale === 'en' ? 'April 2023 Tokens' : router.locale === 'es' ? 'Fichas de abril de 2023' : 'April 2023 Tokens'}
                  </TableCell>
                  <TableCell>
                    {router.locale === 'en' ? 'Public API Documentation Released Tokens' : router.locale === 'es' ? 'Liberación de Documentación Pública de la API Fichas' : 'Public API Documentation Released Tokens'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            {router.locale === 'en' ? 'To understand the process of listing token projects and exchanges on xrpl.to, a Web3 app on the XRP ledger, please refer to our listing policy and frequently asked questions.' : router.locale === 'es' ? 'Para comprender el proceso de listar proyectos de tokens e intercambios en xrpl.to, una aplicación Web3 en el libro mayor XRP, consulte nuestra política de listado y preguntas frecuentes.' : 'To understand the process of listing token projects and exchanges on xrpl.to, a Web3 app on the XRP ledger, please refer to our listing policy and frequently asked questions.'}
            <br /><br />
            {router.locale === 'en' ? 'xrpl.to attracts a significant user base, reaching millions of users annually through its web-based application on the XRP ledger. Users can access the app via the website, mobile platforms, and other communication channels such as newsletters, blogs, and social media platforms including Twitter, Telegram, Facebook, and Instagram. Additionally, xrpl.to hosts Twitter spaces.' : router.locale === 'es' ? 'xrpl.to atrae a una gran base de usuarios, llegando a millones de usuarios anualmente a través de su aplicación basada en la web en el libro mayor XRP. Los usuarios pueden acceder a la aplicación a través del sitio web, plataformas móviles y otros canales de comunicación como boletines, blogs y plataformas de redes sociales como Twitter, Telegram, Facebook e Instagram. Además, xrpl.to alberga espacios en Twitter.' : 'xrpl.to attracts a significant user base, reaching millions of users annually through its web-based application on the XRP ledger. Users can access the app via the website, mobile platforms, and other communication channels such as newsletters, blogs, and social media platforms including Twitter, Telegram, Facebook, and Instagram. Additionally, xrpl.to hosts Twitter spaces.'}
            <br /><br />
            {router.locale === 'en' ? 'For a comprehensive list of our writers and contributors, please click here.' : router.locale === 'es' ? 'Para obtener una lista completa de nuestros escritores y colaboradores, haga clic aquí.' : 'For a comprehensive list of our writers and contributors, please click here.'}
            <br /><br />
            {router.locale === 'en' ? 'If you are interested in advertising opportunities with xrpl.to or wish to explore our product offerings for companies, please contact us at hello@xrpl.to. For editorial partnerships related to our blog, please reach out to us at hello@xrpl.to.' : router.locale === 'es' ? 'Si está interesado en oportunidades publicitarias con xrpl.to o desea explorar nuestras ofertas de productos para empresas, contáctenos en hello@xrpl.to. Para asociaciones editoriales relacionadas con nuestro blog, comuníquese con nosotros en hello@xrpl.to.' : 'If you are interested in advertising opportunities with xrpl.to or wish to explore our product offerings for companies, please contact us at hello@xrpl.to. For editorial partnerships related to our blog, please reach out to us at hello@xrpl.to.'}
            <br /><br />
            {router.locale === 'en' ? 'To discover potential job openings at xrpl.to, please visit our careers page for more information.' : router.locale === 'es' ? 'Para descubrir posibles ofertas de trabajo en xrpl.to, visite nuestra página de carreras para obtener más información.' : 'To discover potential job openings at xrpl.to, please visit our careers page for more information.'}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </Container>

  <Footer />
</Box>

  );
}

export default AboutPage;

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
    // https://api.xrpl.to/api/banxa/currencies
    const BASE_URL = process.env.API_URL;
    let data = null;
    try {
        var t1 = performance.now();

        const res = await axios.get(`${BASE_URL}/banxa/currencies`);

        data = res.data;

        var t2 = performance.now();
        var dt = (t2 - t1).toFixed(2);

        console.log(`2. getStaticProps fiats: ${data.fiats.length} took: ${dt}ms`);
    } catch (e) {
        console.log(e);
    }
    let ret = {};
    if (data) {
        let ogp = {};

        ogp.canonical = 'https://xrpl.to';
        ogp.title = 'About us';
        ogp.url = 'https://xrpl.to/';
        ogp.imgUrl = 'https://xrpl.to/static/ogp.webp';
        //ogp.desc = 'Meta description here';

        ret = {data, ogp};
    }

    return {
        props: ret, // will be passed to the page component as props
        // Next.js will attempt to re-generate the page:
        // - When a request comes in
        // - At most once every 10 seconds
        revalidate: 10, // In seconds
    }
}
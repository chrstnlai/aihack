import Head from "next/head";

const HeadComponent = () => {
  return <Head>
      <title>Dreamscape</title>
      <meta name="description" content="Visualize your dreams." />
      <meta name="author" content="Dreamscape" />
      <link rel="canonical" href="https://aihack-mu.vercel.app" />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content="Dreamscape" />
      <meta property="og:description" content="Convert your thoughts into reality." />
      <meta property="og:image" content="/dreamscape.png" />
      <meta property="og:url" content="https://aihack-mu.vercel.app" />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@vivivinh" />
      <meta name="twitter:creator" content="@vivivinh" />
      <meta name="twitter:image" content="/dreamscape.png" />

      {/* Theme Color */}
      <meta name="theme-color" content="#000000" />

      {/* Favicon */}
      <link rel="icon" href="../app/favicon.ico" />
      <link rel="apple-touch-icon" href="/dreamscape.png" />
  </Head>
}

export { HeadComponent };
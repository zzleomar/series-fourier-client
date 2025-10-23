const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath:
    process.env.NODE_ENV === "production" ? "/series-fourier-client" : "",
  assetPrefix:
    process.env.NODE_ENV === "production" ? "/series-fourier-client/" : "",
};

export default nextConfig;

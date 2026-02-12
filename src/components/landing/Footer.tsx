const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} KATALYX. Built on proven transformation frameworks.
        </p>
        <p className="text-sm text-muted-foreground">
          Questions? Email us at{" "}
          <a
            href="mailto:contact@katalyx.io"
            className="text-foreground hover:text-primary transition-colors"
          >
            contact@katalyx.io
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

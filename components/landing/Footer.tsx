import Image from "next/image";

const footerLinks = {
  Product: ["Features", "Pricing", "Markets", "API"],
  Resources: ["Documentation", "Tutorials", "Blog", "Support"],
  Company: ["About", "Careers", "Press", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

export const Footer = () => {
  return (
    <footer id="about" className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/assets/icons/logo.svg"
                alt="SignaList"
                width={210}
                height={48}
                className="h-8 w-auto"
              />
            </div>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">
              Professional-grade market analysis tools for traders of all levels.
              Real-time data, advanced charts, and powerful insights.
            </p>
            <div className="flex gap-4">
              {"Twitter LinkedIn Discord".split(" ").map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 font-semibold text-foreground">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 SignaList. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
};

import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parsePageDocument, parsePageDocumentFromJson } from "@/lib/openframe";

import { renderPageDocument } from "./render-page-document";

describe("renderPageDocument", () => {
  it("renders container and text nodes", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "t1",
            type: "text",
            props: { text: "Hello preview" },
            children: [],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }

    render(<div>{renderPageDocument(doc.data)}</div>);

    expect(screen.getByText("Hello preview")).toBeInTheDocument();
    expect(screen.getByText("Hello preview").closest("[data-of-node-id='t1']")).toBeTruthy();
  });

  it("renders frame with children", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "f1",
            type: "frame",
            props: { layout: "horizontal", gap: 8, padding: 4 },
            children: [
              { id: "a", type: "text", props: { text: "A" }, children: [] },
              { id: "b", type: "text", props: { text: "B" }, children: [] },
            ],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }

    render(<div>{renderPageDocument(doc.data)}</div>);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(document.querySelector("[data-of-node-id='f1']")).toBeTruthy();
  });

  it("renders landing MVP golden example", () => {
    const doc = parsePageDocumentFromJson(
      readFileSync(path.join(process.cwd(), "../../openframe/examples/landing-mvp.page.json"), "utf8"),
    );
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }

    render(<div>{renderPageDocument(doc.data)}</div>);

    expect(screen.getByText(/OpenFrame · Phase 2/)).toBeInTheDocument();
    expect(
      screen.getByText(/Ship self-hosted pages from one canonical document\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get started/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on GitHub/i })).toBeInTheDocument();
    expect(document.querySelector("[data-of-node-id='hero']")).toBeTruthy();
    expect(document.querySelector("[data-of-node-id='hero-cta-row']")).toBeTruthy();
    expect(document.getElementById("hero")).toBeTruthy();
    expect(document.getElementById("features")).toBeTruthy();
    expect(document.getElementById("footer")).toBeTruthy();
    expect(screen.getByText(/Feature A/)).toBeInTheDocument();
    expect(screen.getByText(/© OpenFrame — Phase 2 sections example\./)).toBeInTheDocument();
  });

  it("renders heading, link, button, and image nodes", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          { id: "h1", type: "heading", props: { text: "Title", level: 1, align: "start" }, children: [] },
          { id: "l1", type: "link", props: { href: "/x", label: "Go", external: false }, children: [] },
          { id: "b1", type: "button", props: { label: "Click", href: null, variant: "secondary" }, children: [] },
          {
            id: "i1",
            type: "image",
            props: { src: "https://example.com/x.png", alt: "X", width: null, height: null, fit: "cover" },
            children: [],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }
    render(<div>{renderPageDocument(doc.data)}</div>);
    expect(document.querySelector("h1")?.textContent).toBe("Title");
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/x");
    expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "X" })).toHaveAttribute(
      "src",
      "https://example.com/x.png",
    );
  });

  it("renders faq block with details", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "faq1",
            type: "faq",
            props: {
              surface: "default",
              items: [{ question: "Pricing?", answer: "See the readme." }],
            },
            children: [],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }
    render(<div>{renderPageDocument(doc.data)}</div>);
    expect(document.querySelector("[data-of-node-id='faq1']")).toBeTruthy();
    expect(screen.getByText("Pricing?")).toBeInTheDocument();
    expect(screen.getByText("See the readme.")).toBeInTheDocument();
  });

  it("renders testimonial and logo-cloud blocks", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "t1",
            type: "testimonial",
            props: { quote: "Amazing.", author: "Sam", role: "Founder", avatarSrc: "" },
            children: [],
          },
          {
            id: "l1",
            type: "logo-cloud",
            props: { title: "Trusted by", logos: [{ name: "Acme", src: "" }] },
            children: [],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }
    render(<div>{renderPageDocument(doc.data)}</div>);
    expect(screen.getByText("Amazing.")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText("Trusted by")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("renders nav-header block", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "nav1",
            type: "nav-header",
            props: {
              logoLabel: "OpenFrame",
              logoHref: "/",
              links: [{ label: "Pricing", href: "#pricing" }],
              ctaLabel: "Start",
              ctaHref: "#start",
            },
            children: [],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }
    render(<div>{renderPageDocument(doc.data)}</div>);
    expect(screen.getByRole("link", { name: "OpenFrame" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "#start");
  });

  it("renders unknown block fallback", () => {
    const doc = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "u1",
            type: "future-widget",
            props: {},
            children: [],
          },
        ],
      },
    });
    expect(doc.ok).toBe(true);
    if (!doc.ok) {
      return;
    }

    render(<div>{renderPageDocument(doc.data)}</div>);

    expect(screen.getByText(/Unknown block type/i)).toBeInTheDocument();
    expect(screen.getByText(/future-widget/)).toBeInTheDocument();
  });
});

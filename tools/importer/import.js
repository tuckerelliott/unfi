/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector("title");
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, "");
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const noscript = main.querySelector("noscript");
  if (noscript) noscript.remove();

  const header = main.querySelector(".header");
  if (header) header.remove();

  const footer = main.querySelector(".footer.section");
  if (footer) footer.remove();

  main.querySelectorAll("iframe").forEach((el) => el.remove());

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement("img");
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

const createHero = (main, document) => {
  const hero = {};

  const title = document.querySelector("h1");
  const img = document.querySelector("img");
  const subheader = document.querySelector("div.p1");
  const cells = [["Hero"], [img], [title], [subheader]];
  const table = WebImporter.DOMUtils.createTable(cells, document);
  main.prepend(table);

  return hero;
};

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document,
    url,
    html,
    params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, ["header", "footer"]);

    // create the metadata block and append it to the main element
    createMetadata(main, document);

    // Handle anchor links or odd links
    if (main.querySelector('a[href^="#"]')) {
      const u = new URL(url);
      const links = main.querySelectorAll('a[href^="#"]');
      for (let i = 0; i < links.length; i += 1) {
        const a = links[i];
        a.href = `${u.pathname}${a.getAttribute("href")}`;
      }
    }

    // Handle relative links
    const HOSTNAME = new URL(params.originalURL).origin;
    const relativeLinks = main.querySelectorAll('a[href^="/"]');
    for (let i = 0; i < relativeLinks.length; i += 1) {
      const a = relativeLinks[i];
      a.href = `${HOSTNAME}${a.getAttribute("href")}`;
    }

    // final cleanup
    WebImporter.DOMUtils.remove(main, [
      ".megamenu",
      ".footer",
      ".cookie-consent-banner",
    ]);

    // create the hero block and append it to the main element
    createHero(main, document);

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document,
    url,
    html,
    params,
  }) =>
    WebImporter.FileUtils.sanitizePath(
      new URL(url).pathname.replace(/\.html$/, "").replace(/\/$/, "")
    ),
};

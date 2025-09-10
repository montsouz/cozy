import { marked } from "marked";
import hljs from "highlight.js";
import TurndownService from "turndown";

export class WysiwygEditor {
  private editor: HTMLElement;
  private turndown: TurndownService;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastContent: string = "";
  private isProcessing: boolean = false;

  constructor() {
    this.editor = document.getElementById("wysiwyg-editor") as HTMLElement;
    this.turndown = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });

    this.setupMarked();
    this.setupEventListeners();
    this.showPlaceholder();
  }

  private setupMarked(): void {
    marked.setOptions({
      highlight: (code: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {
            console.error("Syntax highlighting error:", err);
          }
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    });
  }

  private setupEventListeners(): void {
    this.editor.addEventListener("input", (e) => {
      if (!this.isProcessing) {
        this.handlePlaceholder();
        this.processLiveFormatting(e as InputEvent);
        this.debouncedSave();
      }
    });

    this.editor.addEventListener("focus", () => {
      this.hidePlaceholder();
    });

    this.editor.addEventListener("blur", () => {
      this.showPlaceholder();
    });

    this.editor.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });

    this.editor.addEventListener("paste", (e) => {
      this.handlePaste(e);
    });
  }

  private handlePlaceholder(): void {
    if (this.editor.textContent?.trim() === "") {
      this.showPlaceholder();
    } else {
      this.hidePlaceholder();
    }
  }

  private showPlaceholder(): void {
    if (this.editor.textContent?.trim() === "") {
      this.editor.classList.add("empty");
    }
  }

  private hidePlaceholder(): void {
    this.editor.classList.remove("empty");
  }

  private processLiveFormatting(e: InputEvent): void {
    if (e.inputType === "insertText" && e.data === " ") {
      this.processSpaceTriggeredFormatting();
    } else if (e.inputType === "insertText") {
      this.processInlineFormatting();
    }
  }

  private processSpaceTriggeredFormatting(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    const offset = range.startOffset;

    if (container.nodeType === Node.TEXT_NODE) {
      const textContent = container.textContent || "";
      const beforeCursor = textContent.substring(0, offset);
      const afterCursor = textContent.substring(offset);

      // Check for heading patterns (requires space after # and some text)
      const headingMatch = beforeCursor.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        console.log("headingMatch", headingMatch);
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        this.replaceWithHeading(container as Text, level, text, afterCursor);
        return;
      }

      // Check for list patterns
      const listMatch = beforeCursor.match(/^[-\*\+]\s*(.*)$/);
      if (listMatch) {
        const text = listMatch[1];
        this.replaceWithList(container as Text, text, afterCursor);
        return;
      }

      // Check for blockquote
      const blockquoteMatch = beforeCursor.match(/^>\s*(.*)$/);
      if (blockquoteMatch) {
        const text = blockquoteMatch[1];
        this.replaceWithBlockquote(container as Text, text, afterCursor);
        return;
      }
    }
  }

  private processInlineFormatting(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    if (container.nodeType === Node.TEXT_NODE) {
      const textContent = container.textContent || "";

      // Check for **bold** or __bold__
      let boldMatch = textContent.match(/\*\*([^*]+)\*\*/);
      if (!boldMatch) {
        boldMatch = textContent.match(/__([^_]+)__/);
      }

      if (boldMatch) {
        this.replaceWithBold(container as Text, boldMatch);
        return;
      }

      // Check for *italic* or _italic_
      let italicMatch = textContent.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      if (!italicMatch) {
        italicMatch = textContent.match(/(?<!_)_([^_]+)_(?!_)/);
      }

      if (italicMatch) {
        this.replaceWithItalic(container as Text, italicMatch);
        return;
      }

      // Check for `code`
      const codeMatch = textContent.match(/`([^`]+)`/);
      if (codeMatch) {
        this.replaceWithCode(container as Text, codeMatch);
        return;
      }
    }
  }

  private replaceWithHeading(
    textNode: Text,
    level: number,
    text: string,
    afterText: string
  ): void {
    console.log("replaceWithHeading", textNode, level, text, afterText);
    this.isProcessing = true;

    const heading = document.createElement(`h${level}`);
    heading.textContent = text;

    const parent = textNode.parentNode;
    if (parent) {
      console.log("parent", parent);
      parent.insertBefore(heading, textNode);

      if (afterText.trim()) {
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(afterNode, textNode);
      }

      parent.removeChild(textNode);

      // Set cursor at end of heading
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(heading, heading.childNodes.length);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 10);
  }

  private replaceWithList(
    textNode: Text,
    text: string,
    afterText: string
  ): void {
    this.isProcessing = true;

    const listItem = document.createElement("li");
    listItem.textContent = text;

    const list = document.createElement("ul");
    list.appendChild(listItem);

    const parent = textNode.parentNode;
    if (parent) {
      parent.insertBefore(list, textNode);

      if (afterText.trim()) {
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(afterNode, textNode);
      }

      parent.removeChild(textNode);

      // Set cursor at end of list item
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(listItem, listItem.childNodes.length);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 10);
  }

  private replaceWithBlockquote(
    textNode: Text,
    text: string,
    afterText: string
  ): void {
    this.isProcessing = true;

    const blockquote = document.createElement("blockquote");
    blockquote.textContent = text;

    const parent = textNode.parentNode;
    if (parent) {
      parent.insertBefore(blockquote, textNode);

      if (afterText.trim()) {
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(afterNode, textNode);
      }

      parent.removeChild(textNode);

      // Set cursor at end of blockquote
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(blockquote, blockquote.childNodes.length);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 10);
  }

  private replaceWithBold(textNode: Text, match: RegExpMatchArray): void {
    this.isProcessing = true;

    const fullMatch = match[0];
    const content = match[1];
    const startIndex = match.index || 0;

    const beforeText = textNode.textContent?.substring(0, startIndex) || "";
    const afterText =
      textNode.textContent?.substring(startIndex + fullMatch.length) || "";

    const parent = textNode.parentNode;
    if (parent) {
      if (beforeText) {
        const beforeNode = document.createTextNode(beforeText);
        parent.insertBefore(beforeNode, textNode);
      }

      const bold = document.createElement("strong");
      bold.textContent = content;
      parent.insertBefore(bold, textNode);

      if (afterText) {
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(afterNode, textNode);
      }

      parent.removeChild(textNode);

      // Set cursor after the bold element
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStartAfter(bold);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 10);
  }

  private replaceWithItalic(textNode: Text, match: RegExpMatchArray): void {
    this.isProcessing = true;

    const fullMatch = match[0];
    const content = match[1];
    const startIndex = match.index || 0;

    const beforeText = textNode.textContent?.substring(0, startIndex) || "";
    const afterText =
      textNode.textContent?.substring(startIndex + fullMatch.length) || "";

    const parent = textNode.parentNode;
    if (parent) {
      if (beforeText) {
        const beforeNode = document.createTextNode(beforeText);
        parent.insertBefore(beforeNode, textNode);
      }

      const italic = document.createElement("em");
      italic.textContent = content;
      parent.insertBefore(italic, textNode);

      if (afterText) {
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(afterNode, textNode);
      }

      parent.removeChild(textNode);

      // Set cursor after the italic element
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStartAfter(italic);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 10);
  }

  private replaceWithCode(textNode: Text, match: RegExpMatchArray): void {
    this.isProcessing = true;

    const fullMatch = match[0];
    const content = match[1];
    const startIndex = match.index || 0;

    const beforeText = textNode.textContent?.substring(0, startIndex) || "";
    const afterText =
      textNode.textContent?.substring(startIndex + fullMatch.length) || "";

    const parent = textNode.parentNode;
    if (parent) {
      if (beforeText) {
        const beforeNode = document.createTextNode(beforeText);
        parent.insertBefore(beforeNode, textNode);
      }

      const code = document.createElement("code");
      code.textContent = content;
      parent.insertBefore(code, textNode);

      if (afterText) {
        const afterNode = document.createTextNode(afterText);
        parent.insertBefore(afterNode, textNode);
      }

      parent.removeChild(textNode);

      // Set cursor after the code element
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStartAfter(code);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 10);
  }

  private debouncedSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      // Auto-save functionality could be added here
    }, 500);
  }

  private handleKeydown(e: KeyboardEvent): void {
    // Handle Enter key for better paragraph behavior
    if (e.key === "Enter") {
      // Let default behavior handle this for now
      // Could add custom logic for better block element handling
    }

    // Handle Tab key
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "  ");
    }

    // Handle formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          this.toggleFormat("bold");
          break;
        case "i":
          e.preventDefault();
          this.toggleFormat("italic");
          break;
        case "u":
          e.preventDefault();
          this.toggleFormat("underline");
          break;
      }
    }
  }

  private handlePaste(e: ClipboardEvent): void {
    e.preventDefault();
    const paste = e.clipboardData?.getData("text/plain");
    if (paste) {
      document.execCommand("insertText", false, paste);
    }
  }

  private toggleFormat(command: string): void {
    document.execCommand(command, false);
  }

  public setMarkdown(markdown: string): void {
    const html = marked(markdown) as string;
    this.editor.innerHTML = html;
    this.handlePlaceholder();
  }

  public getMarkdown(): string {
    return this.turndown.turndown(this.editor.innerHTML);
  }

  public getHtml(): string {
    return this.editor.innerHTML;
  }

  public focus(): void {
    this.editor.focus();
    this.hidePlaceholder();
  }

  public clear(): void {
    this.editor.innerHTML = "";
    this.showPlaceholder();
  }
}

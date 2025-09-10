import "./index.css";
import "highlight.js/styles/github-dark.css";
import { WysiwygEditor } from "./editor";

document.addEventListener("DOMContentLoaded", () => {
  const editor = new WysiwygEditor();

  // Welcome text will only show if no saved content is found
  // The editor will automatically load from database in its constructor

  editor.focus();
});

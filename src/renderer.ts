import './index.css';
import 'highlight.js/styles/github-dark.css';
import { WysiwygEditor } from './editor';

document.addEventListener('DOMContentLoaded', () => {
  const editor = new WysiwygEditor();
  
  const welcomeText = `# Welcome to Cozy

This editor formats markdown instantly as you type, just like Notion!

## Try These Live Formatting Tricks:

**Type # followed by space** - Creates a heading
**Type - followed by space** - Creates a bullet list  
**Type > followed by space** - Creates a blockquote
**Type \`code\`** - Creates inline code
**Type \*\*bold\*\*** - Creates **bold text**
**Type \*italic\*** - Creates *italic text*

## Example Text

You can edit everything directly. Try typing:

\`console.log("Hello World")\` 

> This is a blockquote - edit me!

- This is a list item
- This is another item

## More Features

- **Real-time formatting**: No need to switch between edit/preview
- **Dark theme**: Beautiful on the eyes  
- **Clean interface**: Distraction-free writing

---

**Go ahead - clear this text and start writing your own!**

Try typing: "# My New Document" followed by space...`;

  editor.setMarkdown(welcomeText);
  editor.focus();
});

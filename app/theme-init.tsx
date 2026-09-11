const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('indus-theme')==='light'?'light':'dark'}catch{document.documentElement.dataset.theme='dark'}`;

export function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}

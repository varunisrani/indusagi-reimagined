export type NavItem = { text: string; url: string; section?: string };
export type Section = { id: string; title: string };
export type DocumentPage = { kind?: string; title: string; html: string; nav: NavItem[]; sections: Section[] };

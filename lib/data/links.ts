/**
 * All external links (source of truth: layout.md).
 * External links must always be rendered with `target="_blank" rel="noopener noreferrer"`.
 */
export type LinkEntry = {
  label: string;
  href: string;
};

export type PhoneInfo = {
  /** Human-readable display form. */
  display: string;
  telHref: string;
  whatsappHref: string;
};

export const links: {
  facebook: LinkEntry;
  gmail: LinkEntry;
  linkedin: LinkEntry;
  /** TBD per layout.md — null renders the button disabled with a TODO. */
  instagram: LinkEntry | null;
  appointment: LinkEntry;
  phone: PhoneInfo;
} = {
  facebook: {
    label: "Facebook",
    href: "https://www.facebook.com/brianesmade",
  },
  gmail: {
    label: "Gmail",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=jbesmade@gmail.com",
  },
  linkedin: {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/john-brian-esmade-891991328",
  },
  // TODO: Instagram URL is TBD — set it here once known; button is disabled meanwhile.
  instagram: null,
  appointment: {
    label: "Book an Appointment",
    href: "https://calendar.app.google/XobHrzracTv6pCt38",
  },
  phone: {
    display: "+63 955 977 2486",
    telHref: "tel:+639559772486",
    whatsappHref: "https://wa.me/639559772486",
  },
};

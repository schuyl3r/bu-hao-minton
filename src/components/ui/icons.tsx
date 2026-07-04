type IconProps = { className?: string };

const DEFAULT_SIZE = "h-[18px] w-[18px]";

/** "Request a match" — a person plus a "+", not the bare "+" this replaces. */
export function UserPlusIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 20c.7-3.6 3-5.4 5.5-5.4s4.8 1.8 5.5 5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M18 7.5v6M15 10.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 20l.9-4.2L15.6 5.1a1.5 1.5 0 0 1 2.1 0l1.2 1.2a1.5 1.5 0 0 1 0 2.1L8.2 19.1 4 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14.2 6.5l3.3 3.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function QuestionMarkIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.3 9.8a2.7 2.7 0 1 1 3.8 2.5c-.75.36-1.1.8-1.1 1.5v.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 19l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function XIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ShuttleIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="18.2" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 15.9L7.2 4.2M12 15.9L10.4 3.6M12 15.9L13.6 3.6M12 15.9L16.8 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GithubIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.8c-2.92.64-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.08.88.1-.68.37-1.15.66-1.42-2.33-.26-4.78-1.17-4.78-5.2 0-1.15.41-2.09 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.08a9.9 9.9 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.52.1 2.79.67.73 1.08 1.67 1.08 2.82 0 4.04-2.46 4.93-4.8 5.19.38.33.71.97.71 1.96v2.9c0 .28.19.62.72.51A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  );
}

export function TrashIcon({ className = DEFAULT_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .8 12.1a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9L17 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

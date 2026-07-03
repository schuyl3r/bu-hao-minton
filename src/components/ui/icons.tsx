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

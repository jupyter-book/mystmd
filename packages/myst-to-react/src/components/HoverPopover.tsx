import React, { useRef, useState } from 'react';
import { Transition } from '@headlessui/react';
import { usePopper } from 'react-popper';

export function HoverPopover({
  children,
  card,
}: {
  children: React.ReactNode;
  card: React.ReactNode | ((args: { open: boolean; close?: () => void }) => React.ReactNode);
}) {
  const buttonRef = useRef<HTMLSpanElement | null>(null);
  const timeoutDuration = 300;
  const [open, setOpen] = useState(false);
  let openTimeout: NodeJS.Timeout | undefined;
  let closeTimeout: NodeJS.Timeout | undefined;

  const onMouseEnter = () => {
    clearTimeout(closeTimeout);
    if (open) return;
    setOpen(true);
  };

  const onMouseLeave = () => {
    clearTimeout(openTimeout);
    if (!open) return;
    closeTimeout = setTimeout(() => setOpen(false), timeoutDuration);
  };
  const [popperElement, setPopperElement] = useState<HTMLSpanElement | null>(null);
  const { styles, attributes } = usePopper(buttonRef.current, popperElement, {
    placement: 'bottom-start',
  });
  return (
    <span onMouseLeave={onMouseLeave}>
      <span ref={buttonRef} onMouseMove={onMouseEnter} onMouseEnter={onMouseEnter}>
        {children}
      </span>
      <span
        className="exclude-from-outline absolute z-30 sm:max-w-[500px]"
        ref={setPopperElement}
        style={{ ...styles.popper }}
        {...attributes.popper}
      >
        <Transition
          className="my-2 p-4 shadow-xl bg-white dark:bg-zinc-900 text-sm dark:text-white rounded border border-slate-100 dark:border-zinc-500 break-words"
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
          onMouseEnter={onMouseEnter}
          show={open}
        >
          {typeof card === 'function' ? card({ open, close: () => setOpen(false) }) : card}
        </Transition>
      </span>
    </span>
  );
}

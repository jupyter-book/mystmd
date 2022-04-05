import React, { ElementType, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { usePopper } from 'react-popper';

export function ClickPopover({
  children,
  card,
  as = 'cite',
}: {
  children: React.ReactNode;
  card: React.ReactNode;
  as?: ElementType;
}) {
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement);
  return (
    <Popover as="span">
      <Popover.Button
        ref={setReferenceElement}
        as={as}
        className="cursor-zoom-in border-b-2 border-dotted"
      >
        {children}
      </Popover.Button>
      <Popover.Panel
        className="absolute z-30 sm:max-w-[500px]"
        ref={setPopperElement}
        style={{ ...styles.popper }}
        {...attributes.popper}
      >
        <Transition
          className="my-2 p-4 shadow-xl bg-white dark:bg-zinc-900 text-sm dark:text-white rounded border-2 border-slate-200 dark:border-zinc-500 break-words"
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          {card}
        </Transition>
      </Popover.Panel>
    </Popover>
  );
}

export function CurvenoteLogo({
  size = 24,
  fill = '#235F9D',
  className,
}: {
  size?: number;
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      stroke="none"
      fill={fill || 'currentColor'}
      className={className}
    >
      <g id="icon">
        <path
          d="M389.8,304.2c0,47.2-38.2,85.5-85.5,85.6c-47.2,0-85.5-38.2-85.6-85.5c0-47.2,38.2-85.5,85.5-85.6c0,0,0,0,0,0
		C351.5,218.7,389.8,257,389.8,304.2z"
        />
        <path d="M10.2,218.8h171v171C86.7,389.8,10.2,313.2,10.2,218.8z" />
        <path d="M60.3,60.3c32-32.1,75.6-50.2,120.9-50.1v171.1h-171C10.1,135.8,28.1,92.3,60.3,60.3z" />
        <path d="M339.7,131.1c-32,32.1-75.6,50.2-120.9,50.1V10.2h171C389.9,55.5,371.8,99,339.7,131.1z" />
      </g>
    </svg>
  );
}

export function CreatedInCurvenote() {
  return (
    <a
      className="flex w-fit mx-auto text-gray-700 hover:text-blue-700 dark:text-gray-200 dark:hover:text-blue-400"
      href="https://curvenote.com"
      target="_blank"
    >
      <CurvenoteLogo />
      <span className="self-center text-sm ml-2">Created in Curvenote</span>
    </a>
  );
}

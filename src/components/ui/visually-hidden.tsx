import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export default ({ children }: { children: React.ReactNode }) => (
  <VisuallyHidden.Root>{children}</VisuallyHidden.Root>
);

import { type ReactNode, type FormEvent } from 'react';

interface FormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  className?: string;
}

export const Form = ({ children, onSubmit, className }: FormProps) => {
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
};

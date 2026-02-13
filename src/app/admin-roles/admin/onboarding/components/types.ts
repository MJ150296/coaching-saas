export type StepStatus = { type: 'idle' | 'loading' | 'success' | 'error'; message: string };

export type StepMeta = {
  title: string;
  description: string;
};

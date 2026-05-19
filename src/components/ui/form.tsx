import React from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormProps<TFieldValues extends FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  methods: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => Promise<void> | void;
}

export function Form<TFieldValues extends FieldValues>({
  methods,
  onSubmit,
  className,
  children,
  ...props
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

export function FormControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function FormLabel({
  htmlFor,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted", className)} {...props} />;
}

export function FormMessage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xs font-medium text-red-500", className)} {...props} />;
}

export function FormGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FormRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)} {...props} />;
}

'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/Forms/InputField';
import FooterLink from '@/components/Forms/FooterLinks';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

const ResetPasswordForm = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [formError, setFormError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        defaultValues: { password: '', confirmPassword: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setFormError('');
        if (!token) {
            setFormError('Invalid reset link. Please request a new one.');
            return;
        }
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: data.password }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error || 'Failed to reset password.');
            }
            setIsSuccess(true);
        } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Failed to reset password.');
        }
    };

    if (!token) {
        return (
            <>
                <h1 className="form-title">Invalid link</h1>
                <p className="text-muted-foreground mb-6">
                    This password reset link is invalid or has expired.
                </p>
                <FooterLink text="Request a new" linkText="reset link" href="/forgot-password" />
            </>
        );
    }

    if (isSuccess) {
        return (
            <>
                <h1 className="form-title">Password reset</h1>
                <p className="text-muted-foreground mb-6">
                    Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <FooterLink text="Go to" linkText="Sign in" href="/sign-in" />
            </>
        );
    }

    return (
        <>
            <h1 className="form-title">Reset password</h1>
            <p className="text-muted-foreground mb-6">
                Enter your new password below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="password"
                    label="New Password"
                    placeholder="Enter your new password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <InputField
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your new password"
                    type="password"
                    register={register}
                    error={errors.confirmPassword}
                    validation={{
                        required: 'Please confirm your password',
                        validate: (value: string) =>
                            value === watch('password') || 'Passwords do not match',
                    }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
                {formError && <p className="text-sm text-red-500">{formError}</p>}

                <FooterLink text="Remember your password?" linkText="Sign in" href="/sign-in" />
            </form>
        </>
    );
};

const ResetPassword = () => {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
};
export default ResetPassword;

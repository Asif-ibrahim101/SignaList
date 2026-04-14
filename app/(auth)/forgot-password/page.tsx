'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/Forms/InputField';
import FooterLink from '@/components/Forms/FooterLinks';
import { useState } from 'react';

const ForgotPassword = () => {
    const [formError, setFormError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        defaultValues: { email: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setFormError('');
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error || 'Something went wrong.');
            }
            setIsSuccess(true);
        } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Something went wrong.');
        }
    };

    if (isSuccess) {
        return (
            <>
                <h1 className="form-title">Check your email</h1>
                <p className="text-muted-foreground mb-6">
                    If an account with that email exists, we sent a password reset link.
                    Please check your inbox and spam folder.
                </p>
                <FooterLink text="Back to" linkText="Sign in" href="/sign-in" />
            </>
        );
    }

    return (
        <>
            <h1 className="form-title">Forgot password</h1>
            <p className="text-muted-foreground mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@jsmastery.com"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
                {formError && <p className="text-sm text-red-500">{formError}</p>}

                <FooterLink text="Remember your password?" linkText="Sign in" href="/sign-in" />
            </form>
        </>
    );
};
export default ForgotPassword;

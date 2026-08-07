import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { defaultBrandProfile } from "@/lib/mock-data";


// ─── Validation schema ────────────────────────────────────────────────────────

const brandProfileSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  productType: z.string().min(1, "Product type is required"),
  description: z
    .string()
    .min(20, "Please describe your brand in at least 20 characters"),
  idealCustomer: z.string().min(1, "Ideal customer is required"),
  monthlyBudget: z.string().min(1, "Monthly budget is required"),
});

type BrandProfileFormValues = z.infer<typeof brandProfileSchema>;

const PRODUCT_TYPES = [
  "Physical products",
  "Services",
  "Digital products",
  "SaaS / Software",
  "Mobile app",
  "Other",
];

// ─── Analyzing state ──────────────────────────────────────────────────────────

function AnalyzingState() {
  return (
    <section className="mx-auto grid min-h-[65vh] max-w-xl place-items-center text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-xl bg-accent text-primary shadow-sm">
          <Sparkles size={28} />
        </span>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="signal-dot size-2.5 rounded-full bg-primary"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <h1 className="mt-5 text-2xl font-bold">Building your advertising plan</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Comparing audience behavior, platform strengths, content formats, and
          relevant creator categories.
        </p>
      </div>
    </section>
  );
}

// ─── Brand Profile form ───────────────────────────────────────────────────────

export function BrandProfile() {
  const { user, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandProfileFormValues>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      brandName: defaultBrandProfile.brandName,
      productType: defaultBrandProfile.productType,
      description: defaultBrandProfile.description,
      idealCustomer: defaultBrandProfile.idealCustomer,
      monthlyBudget: defaultBrandProfile.monthlyBudget,
    },
  });

  function onValidSubmit() {
    // Immediate action (component mounted — show animation then navigate)
    function runImmediate() {
      setAnalyzing(true);
      setTimeout(() => void navigate({ to: "/strategy-report" }), 2200);
    }

    // Deferred action (called post-login — component may be unmounted)
    function runDeferred() {
      void navigate({ to: "/strategy-report" });
    }

    if (user) {
      // Already authenticated — show the analyzing animation
      runImmediate();
    } else {
      // Not authenticated — store the deferred action and go to login
      requireAuth(runDeferred, () => void navigate({ to: "/login" }));
    }
  }

  if (analyzing) {
    return <AnalyzingState />;
  }

  return (
    <>
      <p className="text-sm font-medium text-primary">Brand analysis</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Tell us what you sell.</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Plain language is perfect. Signal Wire uses these details to find the
        right advertising channels, content formats, and creator types.
      </p>

      <section className="mt-6 max-w-3xl rounded-lg border border-border bg-card p-4 shadow-sm sm:mt-8 sm:p-6">
        <form
          id="brand-profile-form"
          onSubmit={handleSubmit(onValidSubmit)}
          noValidate
        >
          {/* Row 1: Brand name + Product type */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="brandName"
                className="block text-sm font-medium text-foreground"
              >
                Brand name
              </label>
              <input
                id="brandName"
                {...register("brandName")}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
              {errors.brandName && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.brandName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="productType"
                className="block text-sm font-medium text-foreground"
              >
                What do you sell?
              </label>
              <select
                id="productType"
                {...register("productType")}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.productType && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.productType.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground"
            >
              Describe your brand and product
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="mt-2 min-h-32 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm font-normal leading-6 text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Row 2: Ideal customer + Budget */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="idealCustomer"
                className="block text-sm font-medium text-foreground"
              >
                Ideal customer
              </label>
              <input
                id="idealCustomer"
                {...register("idealCustomer")}
                placeholder="e.g. Women, 22–38, urban, fashion-conscious"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
              {errors.idealCustomer && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.idealCustomer.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="monthlyBudget"
                className="block text-sm font-medium text-foreground"
              >
                Monthly ad budget
              </label>
              <input
                id="monthlyBudget"
                {...register("monthlyBudget")}
                placeholder="e.g. ₹50,000 or $500"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
              />
              {errors.monthlyBudget && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.monthlyBudget.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              size="lg"
              id="generate-strategy-button"
              className="h-12 w-full sm:h-11 sm:w-auto"
            >
              <Sparkles size={17} />
              Generate my strategy
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}

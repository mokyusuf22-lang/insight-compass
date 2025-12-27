import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription tier configuration
const TIERS = {
  pro: {
    product_id: "prod_TgTbdj3utKDYWA",
    price_id: "price_1Sj6eHL0zPm1HkkeRvGTpvL0",
    name: "Pro",
    price: 4900, // £49 in pence
  },
  premium: {
    product_id: "prod_TgTbmAzfxTD7hl",
    price_id: "price_1Sj6eZL0zPm1HkkeEX3o0pPg",
    name: "Premium",
    price: 14900, // £149 in pence
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: "free",
        tier_name: "Free",
        product_id: null,
        subscription_end: null,
        cancel_at_period_end: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let tier = "free";
    let tierName = "Free";
    let productId = null;
    let subscriptionEnd = null;
    let cancelAtPeriodEnd = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      cancelAtPeriodEnd = subscription.cancel_at_period_end;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      
      // Determine tier based on product ID
      if (productId === TIERS.premium.product_id) {
        tier = "premium";
        tierName = "Premium";
      } else if (productId === TIERS.pro.product_id) {
        tier = "pro";
        tierName = "Pro";
      }
      
      logStep("Determined subscription tier", { tier, productId });
    } else {
      // Check for canceled subscriptions that are still active until period end
      const canceledSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "canceled",
        limit: 1,
      });
      
      if (canceledSubs.data.length > 0) {
        const canceledSub = canceledSubs.data[0];
        const endDate = new Date(canceledSub.current_period_end * 1000);
        
        if (endDate > new Date()) {
          subscriptionEnd = endDate.toISOString();
          cancelAtPeriodEnd = true;
          productId = canceledSub.items.data[0].price.product as string;
          
          if (productId === TIERS.premium.product_id) {
            tier = "premium";
            tierName = "Premium";
          } else if (productId === TIERS.pro.product_id) {
            tier = "pro";
            tierName = "Pro";
          }
          
          logStep("Found canceled subscription still in period", { tier, endDate: subscriptionEnd });
        }
      } else {
        logStep("No active subscription found");
      }
    }

    return new Response(JSON.stringify({
      subscribed: tier !== "free",
      tier,
      tier_name: tierName,
      product_id: productId,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

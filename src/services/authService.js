import { supabase } from '@/lib/supabaseClient';
import { isPast, isValid, parseISO } from 'date-fns';

export const fetchActiveLicenseDetails = async (userProfile, currentCompanyId) => {
  if (userProfile?.role === 'admin') {
    return { 
      activeLicense: { 
        planName: 'Admin Full Access', 
        features: ['admin_full_access'], 
        isActive: true,
        status: 'active',
      }, 
      isLoadingLicense: false, 
      errorLicense: null 
    };
  }

  if (!userProfile?.id) {
    return { activeLicense: null, isLoadingLicense: false, errorLicense: null };
  }

  try {
    let query = supabase
      .from('licenses')
      .select(`
        *,
        license_type_id (
          name,
          features
        )
      `)
      .eq('user_id', userProfile.id)
      .in('status', ['active', 'trialing']);

    if (currentCompanyId) {
      query = query.eq('company_id', currentCompanyId);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const { status, end_date, trial_ends_at, license_type_id } = data;
      const isTrial = status === 'trialing';
      const relevantExpiryDate = isTrial ? trial_ends_at : end_date;
      let licenseIsValid = true;

      if (relevantExpiryDate && isValid(parseISO(relevantExpiryDate))) {
        if (isPast(parseISO(relevantExpiryDate))) {
          licenseIsValid = false;
        }
      }
      
      let featuresArray = [];
      if (license_type_id?.features) {
        if (Array.isArray(license_type_id.features)) {
          featuresArray = license_type_id.features;
        } else {
           console.warn("License features are not in the expected array format:", license_type_id.features);
        }
      }

      if (licenseIsValid) {
        return { 
          activeLicense: {
            ...data,
            planName: license_type_id?.name || data.plan_name || 'N/A',
            features: featuresArray, 
            isActive: true,
          }, 
          isLoadingLicense: false, 
          errorLicense: null 
        };
      }
    }
    return { activeLicense: null, isLoadingLicense: false, errorLicense: null };
  } catch (err) {
    console.error('Error fetching active license details:', err);
    return { activeLicense: null, isLoadingLicense: false, errorLicense: err.message };
  }
};

export const fetchUserSessionData = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    if (sessionError.message.includes("Invalid Refresh Token") || sessionError.message.includes("Refresh Token Not Found") || sessionError.message.includes("Session from session_id claim in JWT does not exist")) {
      throw sessionError;
    }
    throw sessionError;
  }
  
  if (!session) {
    return { userProfile: null, userCompanies: [], currentCompanyId: null };
  }

  let { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError;
  }

  if (!userProfile) {
    console.log(`AuthService: Profile not found for user ${session.user.id}. Retrying...`);
    await new Promise(resolve => setTimeout(resolve, 2500));
    const { data: retryData, error: retryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (retryError && retryError.code !== 'PGRST116') {
      console.error("Error on profile fetch retry:", retryError);
    }
    userProfile = retryData;
  }

  if (!userProfile) {
    console.warn(`AuthService: Profile still not found for user ${session.user.id} after retry.`);
    return { userProfile: null, userCompanies: [], currentCompanyId: null };
  }

  const { data: userCompanies, error: companiesError } = await supabase.rpc('get_user_companies_with_details', { user_id_param: session.user.id });
  if (companiesError) {
    throw companiesError;
  }

  return {
    userProfile,
    userCompanies: userCompanies || [],
    currentCompanyId: userProfile.current_company_id,
  };
};
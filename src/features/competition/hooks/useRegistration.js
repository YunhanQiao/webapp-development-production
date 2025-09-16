import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerPlayerForTournament } from "../competitionActions";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { playerRegistrationSchema } from "../tournamentSchema";
import * as CompetitionServices from "../competitionServices";
import { CardElement } from "@stripe/react-stripe-js";
import { getCurrencyMultiplier, validateEntryFee } from "../utils/currencyUtils";

const useRegistration = ({ show, onClose, tournament, stripeProps }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.user);
  const jwtToken = useSelector(state => state.user.tokens.jwtToken);
  const [divisionsList, setDivisionsList] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [cardError, setCardError] = useState("");
  const currencyCode = tournament?.regPaymentInfo?.currencyType || "USD";
  const shouldShowSizes =
    tournament?.regPaymentInfo?.askSwag !== false && tournament?.regPaymentInfo?.swagSizes?.length > 0;
  const payThroughApp = tournament?.regPaymentInfo?.payThroughApp;

  const form = useForm({
    resolver: yupResolver(playerRegistrationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      userId: user?._id || "", // Make sure userId is explicitly set
      division: "",
      swagSize: null,
      billingEmail: user?.accountInfo?.email || "",
      paymentIntentId: "",
      avgGolfScore: "",
      fiveKRunningTime: "",
      shouldShowSizes,
      playerName: `${user?.personalInfo?.firstName || ""} ${user?.personalInfo?.lastName || ""}`.trim(),
      divisionName: "",
      homeCountry: user?.personalInfo?.homeCountry || "",
    },
  });

  const checkAgeEligibility = (birthdate, minAge, maxAge) => {
    const birthYear = new Date(formatDate(birthdate)).getFullYear();
    const currentYear = new Date().getFullYear();
    const userAge = currentYear - birthYear;
    return userAge >= minAge && userAge <= maxAge;
  };

  useEffect(() => {
    form.setValue("shouldShowSizes", shouldShowSizes);
  }, [shouldShowSizes, form.setValue]);

  // Also, update the form values when the user data changes
  useEffect(() => {
    if (user && user._id) {
      form.setValue("userId", user._id);
    }
  }, [user, form.setValue]);

  useEffect(() => {
    if (tournament?.divisions?.length) {
      const divisionsFiltered = tournament.divisions.filter(division => {
        const userGender = formatGender(user?.personalInfo?.parGender);
        const isGenderMatch =
          division.gender === "any" ||
          division.gender === "All" ||
          division.gender.toLowerCase() === "all" ||
          division.gender === userGender;
        const isAgeMatch = user?.personalInfo?.birthdate
          ? checkAgeEligibility(user.personalInfo.birthdate, division.minAge, division.maxAge)
          : false;

        return isGenderMatch && isAgeMatch;
      });
      setDivisionsList(divisionsFiltered);
    }
  }, [tournament]);

  useEffect(() => {
    if (tournament?.players && user?._id) {
      const registered = tournament.players.some(player => player.userId === user._id);
      setIsAlreadyRegistered(registered);
    }
  }, [tournament, user]);

  useEffect(() => {
    const selectedDivisionId = form.watch("division");
    const selectedDivision = divisionsList.find(d => d._id === selectedDivisionId);
    if (selectedDivision) {
      form.setValue("divisionName", selectedDivision.name);
    }
  }, [form.watch("division"), divisionsList, form.setValue]);

  const validateCardElement = async (stripe, elements) => {
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return false;
    }

    try {
      const { error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      return !error;
    } catch (e) {
      return false;
    }
  };

  const onSubmit = async (data, step) => {
    console.log("Form submission data:", data);
    console.log("User ID in submission:", data.userId);

    if (isAlreadyRegistered) return;
    setIsRegistering(true);
    let paymentIntentId = null;

    try {
      if (payThroughApp && step === 2) {
        const { stripe, elements } = stripeProps || {};
        if (!stripe || !elements) {
          setCardError("Payment system has not been initialized");
          setIsRegistering(false);
          return;
        }

        const isCardValid = await validateCardElement(stripe, elements);
        if (!isCardValid) {
          setCardError("Please enter valid card information");
          setIsRegistering(false);
          return;
        }

        const selectedDivision = divisionsList.find(d => d._id === data.division);
        const entryFee = selectedDivision.entryFee || 0;
        const processingPercent = tournament?.regPaymentInfo?.processingPercent || 0;
        const flatTransactionFee = tournament?.regPaymentInfo?.processingFee || 0;

        const processingFee = (entryFee * processingPercent) / 100;
        const flatFee = flatTransactionFee;
        const total = entryFee + processingFee + flatFee;

        // Get currency multiplier for Stripe
        const multiplier = getCurrencyMultiplier(currencyCode);

        // Validate minimum amount
        const validation = validateEntryFee(entryFee, currencyCode);
        if (!validation.valid) {
          setCardError(validation.message);
          setIsRegistering(false);
          return;
        }

        const paymentIntentResponse = await CompetitionServices.createPaymentIntent(
          tournament._id,
          {
            amount: Math.round(total * multiplier),
            //currency: tournament.regPaymentInfo.currencyType || "USD",
            currency: currencyCode,
            email: data.billingEmail,
          },
          jwtToken,
        );

        if (!paymentIntentResponse?.data?.clientSecret) {
          setCardError("Failed to initialize payment");
          setIsRegistering(false);
          return;
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          paymentIntentResponse.data.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                email: data.billingEmail,
              },
            },
          },
        );

        if (stripeError) {
          setCardError(stripeError.message);
          setIsRegistering(false);
          return;
        }

        if (paymentIntent.status !== "succeeded") {
          setCardError("Payment failed");
          setIsRegistering(false);
          return;
        }
        paymentIntentId = paymentIntent.id;
      }

      const selectedDivision = divisionsList.find(d => d._id === data.division);
      let totalFeesPaid = null;
      let processingFee = 0;
      let flatFee = 0;

      if (selectedDivision && payThroughApp) {
        const entryFee = selectedDivision.entryFee || 0;
        const processingPercent = tournament?.regPaymentInfo?.processingPercent || 0;
        const flatTransactionFee = tournament?.regPaymentInfo?.processingFee || 0;
        processingFee = (entryFee * processingPercent) / 100;
        flatFee = flatTransactionFee;
        totalFeesPaid = entryFee + processingFee + flatFee;
      }

      const success = await dispatch(
        registerPlayerForTournament(
          tournament._id,
          data.division,
          data.swagSize,
          data.avgGolfScore,
          data.fiveKRunningTime,
          data.playerName,
          data.divisionName,
          paymentIntentId,
          totalFeesPaid,
          data.homeCountry,
        ),
      );

      if (success) {
        setIsAlreadyRegistered(true);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setCardError(error.message || "An error occurred during registration");
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = dateString => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const formatGender = gender => {
    if (!gender) return "Not specified";

    const formattedGender = gender.trim().toLowerCase();

    if (formattedGender === "mens") return "Male";
    if (formattedGender === "womens") return "Female";

    return gender;
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    setValue: form.setValue,
    watch: form.watch,
    trigger: form.trigger,
    formState: form.formState,
    divisionsList,
    isRegistering,
    shouldShowSizes,
    onSubmit,
    formatDate,
    formatGender,
    isAlreadyRegistered,
    showValidation,
    setShowValidation,
    cardError,
    setCardError,
    currencyCode,
  };
};

export default useRegistration;

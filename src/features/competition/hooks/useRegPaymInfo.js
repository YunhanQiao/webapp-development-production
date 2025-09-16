import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { format, isValid } from "date-fns";
import { SWAG_SIZES } from "../tournamentSchema";

const useRegPaymentInfo = () => {
  const {
    setValue,
    getValues,
    watch,
    formState: { defaultValues },
    ...methods
  } = useFormContext();
  const askSwag = watch("askSwag");
  const capReg = watch("capReg");

  useEffect(() => {
    const swagSizes = getValues("swagSizes") || [];

    const processingPercent = getValues("processingPercent");
    const processingFee = getValues("processingFee");
    const capRegAt = getValues("capRegAt");

    if (!processingPercent) {
      setValue("processingPercent", 0.0);
    }
    if (!processingFee) {
      setValue("processingFee", 0.0);
    }
    if (!capRegAt) {
      setValue("capRegAt", 9999);
    }

    // Handle dates with validation
    const regStartDate = getValues("regStartDate");
    const regEndDate = getValues("regEndDate");
    const maxAllowedWithdraDate = getValues("maxAllowedWithdraDate");

    if (isValid(new Date(regStartDate))) {
      setValue("regStartDate", format(new Date(regStartDate), "yyyy-MM-dd"));
    }

    if (isValid(new Date(regEndDate))) {
      setValue("regEndDate", format(new Date(regEndDate), "yyyy-MM-dd"));

      if (!maxAllowedWithdraDate || !isValid(new Date(maxAllowedWithdraDate))) {
        setValue("maxAllowedWithdraDate", format(new Date(regEndDate), "yyyy-MM-dd"));
      }
    }

    if (isValid(new Date(maxAllowedWithdraDate))) {
      setValue("maxAllowedWithdraDate", format(new Date(maxAllowedWithdraDate), "yyyy-MM-dd"));
    }

    if (swagSizes.length > 0) {
      setValue("swagSizes", swagSizes);
    }
  }, [defaultValues, getValues, setValue]);

  useEffect(() => {
    if (capReg) {
      const currentCapRegAt = getValues("capRegAt");
      if (!currentCapRegAt || currentCapRegAt === 9999) {
        setValue("capRegAt", 40);
      }
    } else {
      setValue("capRegAt", 9999);
    }
  }, [capReg, getValues, setValue]);

  useEffect(() => {
    if (!askSwag) {
      setValue("swagSizes", [], {
        shouldDirty: true,
        shouldTouch: true,
      });
    } else if (askSwag && getValues("swagSizes").length === 0) {
      setValue("swagSizes", [...SWAG_SIZES], {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [askSwag, setValue, getValues]);

  const handleSizesChange = e => {
    const currentSizes = getValues("swagSizes") || [];
    const newSizes = e.target.checked
      ? [...currentSizes, e.target.value]
      : currentSizes.filter(size => size !== e.target.value);

    setValue("swagSizes", newSizes, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const currentSwagSizes = watch("swagSizes") || [];
  return {
    handleSizesChange,
    currentSwagSizes,
    methods,
  };
};

export default useRegPaymentInfo;

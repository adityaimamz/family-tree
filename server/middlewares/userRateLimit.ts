import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";

export const userRateLimit = (options: Partial<Options>) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    ...options,
    keyGenerator: (req, res) => {
      if (req.appUser?.id) return `user:${req.appUser.id}`;
      return options.keyGenerator?.(req, res) ?? ipKeyGenerator(req.ip ?? "");
    },
  });

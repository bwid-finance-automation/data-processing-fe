import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("notFoundTitle")} - BW Industrial`;
  }, [t]);

  return (
    <div>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundDesc")}</p>
      <Link to="/">{t("goBackHome")}</Link>
    </div>
  );
}

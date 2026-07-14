from pathlib import Path

import joblib
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from ucimlrepo import fetch_ucirepo


FEATURES = [
    "Curricular units 1st sem (approved)",
    "Curricular units 2nd sem (approved)",
    "Curricular units 1st sem (grade)",
    "Curricular units 2nd sem (grade)",
    "Tuition fees up to date",
    "Scholarship holder",
    "Age at enrollment",
    "Previous qualification (grade)",
    "Debtor",
]

TARGET_LABELS = {
    0: "Dropout",
    1: "Enrolled",
    2: "Graduate",
}


def predict_risk(input_dict):
    """Predict student risk from nine feature values and return the top contributors."""
    model_path = Path(__file__).with_name("model.pkl")
    if not model_path.exists():
        raise FileNotFoundError("The trained model is not available. Run train.py first.")

    model = joblib.load(model_path)
    feature_values = [input_dict[feature] for feature in FEATURES]
    input_frame = pd.DataFrame([feature_values], columns=FEATURES)

    prediction = model.predict(input_frame)[0]
    prediction_value = prediction.item() if hasattr(prediction, "item") else prediction

    if isinstance(prediction_value, (int, float)) and int(prediction_value) in TARGET_LABELS:
        predicted_class = TARGET_LABELS[int(prediction_value)]
    else:
        predicted_class = str(prediction_value)

    classifier = model.named_steps["classifier"]
    feature_importances = list(zip(FEATURES, classifier.feature_importances_))
    top_features = sorted(feature_importances, key=lambda item: item[1], reverse=True)[:3]

    return predicted_class, top_features


def verify_model(model, X_test, y_test) -> None:
    print("\n" + "=" * 60)
    print("VERIFICATION SECTION")
    print("=" * 60)

    print("\n1. Model file check")
    model_path = Path(__file__).with_name("model.pkl")
    if model_path.exists():
        print(f"   Model file exists: {model_path}")
        print(f"   File size: {model_path.stat().st_size} bytes")
    else:
        print(f"   Model file missing: {model_path}")

    print("\n2. Test set evaluation")
    predictions = model.predict(X_test)
    print("   Confusion matrix:")
    print(confusion_matrix(y_test, predictions))
    print("\n   Classification report:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=[TARGET_LABELS[label] for label in sorted(TARGET_LABELS)],
        )
    )

    print("\n3. Manual risk examples")
    high_risk_student = {
        "Curricular units 1st sem (approved)": 2,
        "Curricular units 2nd sem (approved)": 1,
        "Curricular units 1st sem (grade)": 8,
        "Curricular units 2nd sem (grade)": 7,
        "Tuition fees up to date": 0,
        "Scholarship holder": 0,
        "Age at enrollment": 19,
        "Previous qualification (grade)": 12,
        "Debtor": 1,
    }
    low_risk_student = {
        "Curricular units 1st sem (approved)": 20,
        "Curricular units 2nd sem (approved)": 18,
        "Curricular units 1st sem (grade)": 18,
        "Curricular units 2nd sem (grade)": 17,
        "Tuition fees up to date": 1,
        "Scholarship holder": 1,
        "Age at enrollment": 20,
        "Previous qualification (grade)": 16,
        "Debtor": 0,
    }

    for label, payload in [
        ("High risk student", high_risk_student),
        ("Low risk student", low_risk_student),
    ]:
        prediction, top_features = predict_risk(payload)
        print(f"   {label}:")
        print(f"     Prediction: {prediction}")
        print("     Top 3 contributing features:")
        for feature_name, importance in top_features:
            print(f"       - {feature_name}: {importance:.4f}")

    print("\n4. Production-readiness critique")
    print("   - The current approach uses a single train/test split and does not include cross-validation.")
    print("   - No hyperparameter tuning is performed, so the model may be under-optimized.")
    print("   - The feature set is intentionally small, which may miss important signals for real-world risk prediction.")
    print("   - The model should be reviewed with additional validation data and business constraints before deployment.")


def main() -> None:
    dataset = fetch_ucirepo(id=697)
    features = dataset.data.features[FEATURES]
    target = dataset.data.targets["Target"]

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.2,
        random_state=42,
        stratify=target,
    )

    model = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=200,
                    random_state=42,
                ),
            ),
        ]
    )

    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    predictions = model.predict(X_test)
    print(f"Test accuracy: {accuracy:.4f}")
    print("Confusion matrix:")
    print(confusion_matrix(y_test, predictions))

    classifier = model.named_steps["classifier"]
    print("Feature importances:")
    for feature_name, importance in zip(FEATURES, classifier.feature_importances_):
        print(f"{feature_name}: {importance:.4f}")

    model_path = Path(__file__).with_name("model.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

    verify_model(model, X_test, y_test)


if __name__ == "__main__":
    main()

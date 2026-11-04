
import { useState } from "react";
import {
  Wallet,
  PiggyBank,
  ShoppingCart,
  Target,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  X,
  ExternalLink,
} from "lucide-react";

const learningSections = [
  {
    title: "Budgeting Tips",
    description: "Learn how to plan your income and control your expenses.",
    icon: Wallet,
    color: "bg-blue-100 text-blue-600",
    readMoreUrl: "https://filiapp.treasury.gov.ph/budgeting.html",
    definition:
      "Budgeting means creating a plan for how you will use your money. It helps you understand how much you earn, how much you spend, and how much you can save.",
    exampleTitle: "Example: Monthly Budget",
    example:
      "If you receive ₱10,000 per month, you might allocate ₱5,000 for needs, ₱2,000 for savings, ₱2,000 for personal expenses, and ₱1,000 for unexpected costs.",
    tips: [
      "List your monthly income and expenses.",
      "Separate needs from wants.",
      "Set spending limits for each category.",
      "Review your budget regularly and adjust when necessary.",
    ],
  },
  {
    title: "Saving Strategies",
    description: "Build a saving habit and prepare for future needs.",
    icon: PiggyBank,
    color: "bg-green-100 text-green-600",
    readMoreUrl:
      "https://pia.gov.ph/features/how-to-build-an-emergency-fund-to-beat-debt/",
    definition:
      "Saving is setting aside a portion of your income instead of spending all of it. Consistent saving helps you prepare for emergencies and future expenses.",
    exampleTitle: "Example: Saving Every Month",
    example:
      "If you save ₱500 every month, you will have ₱6,000 after one year, excluding any interest earned.",
    tips: [
      "Save a portion of your income whenever you receive it.",
      "Set a specific purpose for your savings.",
      "Keep your savings separate from your spending money.",
      "Start with an amount you can consistently afford.",
    ],
  },
  {
    title: "Smart Spending",
    description: "Make better purchasing decisions and avoid unnecessary expenses.",
    icon: ShoppingCart,
    color: "bg-orange-100 text-orange-600",
    readMoreUrl:
      "https://www.metrobank.com.ph/articles/learn/how-to-budget-for-impulse-buy",
    definition:
      "Smart spending means thinking carefully before buying something. It helps you avoid impulse purchases and use your money for things that matter most.",
    exampleTitle: "Example: Before Buying",
    example:
      "Before purchasing a ₱2,000 item, compare prices, check whether you really need it, and consider whether it fits your budget.",
    tips: [
      "Make a shopping list before going to the store.",
      "Compare prices and product quality.",
      "Avoid buying things just because they are on sale.",
      "Give yourself time to think before making expensive purchases.",
    ],
  },
  {
    title: "Setting Financial Goals",
    description: "Create realistic money goals and work toward achieving them.",
    icon: Target,
    color: "bg-purple-100 text-purple-600",
    readMoreUrl:
      "https://pia.gov.ph/news/bsp-urges-budgeting-saving-discipline-for-financial-stability/",
    definition:
      "Financial goals are specific things you want to achieve with your money. They give your saving and spending decisions a clear purpose.",
    exampleTitle: "Example: Buying a Laptop",
    example:
      "If your target is to buy a ₱24,000 laptop in 12 months, you need to save ₱2,000 each month.",
    tips: [
      "Identify what you want to achieve.",
      "Set a specific amount and deadline.",
      "Break large goals into smaller monthly targets.",
      "Monitor your progress and celebrate milestones.",
    ],
  },
  {
    title: "Introduction to Investing",
    description: "Understand how investing can help grow your money over time.",
    icon: TrendingUp,
    color: "bg-indigo-100 text-indigo-600",
    readMoreUrl:
      "https://appointment.sec.gov.ph/investors-education-and-information/investment-101/",
    definition:
      "Investing means putting money into an asset with the goal of earning a return over time. Examples include stocks, bonds, mutual funds, and exchange-traded funds (ETFs). Unlike ordinary savings, investments can increase or decrease in value.",
    exampleTitle: "Example: Understanding Investment Returns",
    example:
      "Suppose you invest ₱1,000 in an investment. If its value increases by 5%, it becomes ₱1,050. However, if its value decreases by 5%, it becomes ₱950. Returns are not guaranteed.",
    tips: [
      "Learn how an investment works before putting money into it.",
      "Understand the risks and possible losses.",
      "Avoid investing money you need for immediate expenses.",
      "Diversify instead of putting all your money into one investment.",
      "Be careful of offers promising guaranteed or unusually high returns.",
    ],
  },
  {
    title: "Managing Loans and Debt",
    description: "Learn how to borrow responsibly and manage repayments.",
    icon: CreditCard,
    color: "bg-red-100 text-red-600",
    readMoreUrl:
      "https://www.metrobank.com.ph/articles/learn/negotiate-debt-loan-better",
    definition:
      "A loan is money borrowed from a person or financial institution that must be repaid, usually with interest. Debt management means keeping track of what you owe and making repayments responsibly.",
    exampleTitle: "Example: Understanding Loan Payments",
    example:
      "If you borrow ₱5,000, you may have to repay more than ₱5,000 because of interest and fees. Always check the total repayment amount, monthly payment, interest rate, and due dates before agreeing to a loan.",
    tips: [
      "Borrow only what you can reasonably repay.",
      "Understand the interest rate, fees, and payment schedule.",
      "Pay on time to avoid penalties and additional charges.",
      "Prioritize debts with high interest rates when planning repayments.",
      "Avoid taking a new loan just to pay another loan without a clear repayment plan.",
    ],
  },
  {
    title: "Building an Emergency Fund",
    description: "Prepare for unexpected expenses and financial difficulties.",
    icon: ShieldCheck,
    color: "bg-teal-100 text-teal-600",
    readMoreUrl:
      "https://pia.gov.ph/features/how-to-build-an-emergency-fund-to-beat-debt/",
    definition:
      "An emergency fund is money set aside for unexpected situations such as medical expenses, urgent repairs, or sudden loss of income. It helps you avoid relying on loans when emergencies happen.",
    exampleTitle: "Example: Preparing for Emergencies",
    example:
      "If your essential monthly expenses are ₱8,000, an initial emergency fund goal could be ₱8,000. You can gradually work toward saving three to six months of essential expenses.",
    tips: [
      "Start with a small and achievable savings target.",
      "Keep emergency savings separate from your regular budget.",
      "Use the fund only for genuine emergencies.",
      "Replace the money you use when your financial situation allows.",
    ],
  },
  {
    title: "Financial Safety and Scams",
    description: "Protect your money and recognize common financial scams.",
    icon: ShieldCheck,
    color: "bg-yellow-100 text-yellow-700",
    readMoreUrl:
      "https://pia.gov.ph/features/check-protect-report-bsp-empowers-filipinos-against-online-scams/",
    definition:
      "Financial safety means protecting your money and personal information when using banks, digital wallets, online shopping platforms, and financial services.",
    exampleTitle: "Example: Recognizing a Scam",
    example:
      "Someone messages you claiming you won a prize but asks for your password, PIN, or an OTP to claim it. This is a warning sign. Legitimate providers should not ask you to share these security details.",
    tips: [
      "Never share your password, PIN, or OTP.",
      "Verify websites and payment accounts before sending money.",
      "Be suspicious of investment offers promising guaranteed profits.",
      "Do not click suspicious links or download unknown attachments.",
      "Contact your bank or financial provider through official channels if something seems wrong.",
    ],
  },
];

const reminders = [
  "Small savings can make a big difference over time.",
  "Avoid spending money just because it is available.",
  "Keep track of every expense, even the small ones.",
  "A budget is a guide to help you manage your money, not a restriction.",
  "Understand the risks before making financial decisions.",
];

type LearningSection = (typeof learningSections)[number];

export default function FinancialLiteracy() {
  const [selectedSection, setSelectedSection] =
    useState<LearningSection | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Financial Literacy
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Learn practical ways to manage, save, and grow your money.
        </p>
      </div>

      <div className="rounded-xl bg-green-50 border border-green-100 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-green-100 p-3">
            <Lightbulb className="text-green-600" size={24} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">
              Make Better Financial Decisions
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Managing money is an important life skill. Explore these
              learning topics to understand budgeting, saving, investing,
              debt management, and other financial concepts.
            </p>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="text-gray-700" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">
            Learn the Basics
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {learningSections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setSelectedSection(section)}
                className="group rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-green-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-3 ${section.color}`}>
                    <Icon size={23} />
                  </div>

                  <span className="text-sm font-medium text-green-600 opacity-0 transition group-hover:opacity-100">
                    Read more →
                  </span>
                </div>

                <h3 className="mt-4 font-semibold text-gray-800">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {section.description}
                </p>

                <p className="mt-4 text-xs font-medium text-green-600">
                  Click to learn more
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="text-yellow-600" size={20} />
          <h2 className="font-semibold text-gray-800">
            Financial Reminders
          </h2>
        </div>

        <div className="space-y-3">
          {reminders.map((reminder, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-green-600"
              />
              <p className="text-sm text-gray-700">{reminder}</p>
            </div>
          ))}
        </div>
      </section>

      {selectedSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedSection(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="learning-modal-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-3 ${selectedSection.color}`}
                >
                  <selectedSection.icon size={25} />
                </div>

                <div>
                  <h2
                    id="learning-modal-title"
                    className="text-xl font-bold text-gray-800"
                  >
                    {selectedSection.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Financial Literacy Guide
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                aria-label="Close information"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="mb-2 font-semibold text-gray-800">
                  What is it?
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {selectedSection.definition}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-800">
                  {selectedSection.exampleTitle}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {selectedSection.example}
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-gray-800">
                  Helpful Tips
                </h3>

                <div className="space-y-3">
                  {selectedSection.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-green-600"
                      />
                      <p className="text-sm leading-relaxed text-gray-600">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedSection.title === "Introduction to Investing" ||
                selectedSection.title === "Managing Loans and Debt") && (
                <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs leading-relaxed text-gray-600">
                  This material is for general educational purposes only.
                  It is not personalized financial advice. Consider your
                  financial situation and seek qualified guidance before
                  making investment or borrowing decisions.
                </p>
              )}

              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-800">
                  Want to Learn More?
                </h3>

                <p className="mb-3 text-sm leading-relaxed text-gray-600">
                  Explore this additional educational article to learn
                  more about {selectedSection.title.toLowerCase()}.
                </p>

                <a
                  href={selectedSection.readMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Read More
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

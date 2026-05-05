import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

const WaitlistEmail = ({ userFirstname }: { userFirstname: string }) => {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Tailwind>
        <Head>
          <title>Welcome to Sploy</title>
          <Preview>
            Thanks for joining the Sploy waitlist — we&apos;ll keep you in the
            loop.
          </Preview>
        </Head>
        <Body
          className="bg-[#07080a] py-[40px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-[#101111] p-[32px]">
            <Section className="mt-[16px] text-center">
              <Text className="m-0 text-[28px] font-bold text-white">
                Welcome to <span className="text-[#e5ff00]">Sploy</span>
              </Text>

              <Text className="mb-[16px] mt-[16px] text-[18px] text-[#9c9c9d]">
                You&apos;re on the waitlist
              </Text>

              <Hr className="mx-auto my-[16px] w-[80px] border-solid border-[#1b1c1e]" />
            </Section>

            <Section>
              <Text className="mt-[32px] text-[16px] leading-[24px] text-white">
                Hi {userFirstname},
              </Text>

              <Text className="text-[16px] leading-[24px] text-[#c8c8c9]">
                Thanks for signing up for early access to Sploy. We&apos;re
                building a fast, minimal, keyboard-first workspace for
                developers and we&apos;re excited to have you along for the
                ride.
              </Text>

              <Text className="text-[16px] leading-[24px] text-[#c8c8c9]">
                We&apos;ll reach out the moment your spot is ready. In the
                meantime, keep an eye on your inbox — we&apos;ll share updates
                as we get closer to launch.
              </Text>

              <Text className="mt-[24px] text-[16px] leading-[24px] text-[#c8c8c9]">
                Cheers,
              </Text>

              <Text className="mb-[32px] text-[16px] font-bold text-white">
                The Sploy Team
              </Text>
            </Section>

            <Hr className="my-[24px] border-solid border-[#1b1c1e]" />

            <Section>
              <Text className="m-0 text-center text-[12px] text-[#6a6b6c]">
                &copy; {currentYear} Sploy. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WaitlistEmail;

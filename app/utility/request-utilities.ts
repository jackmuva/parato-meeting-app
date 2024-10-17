import jwt from "jsonwebtoken";

export function signJwt(userId: string | undefined | (() => string)): string {
  const currentTime = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      sub: userId,
      iat: currentTime,
      exp: currentTime + 60 * 60, // 1 hour from now
    },
    process.env.SIGNING_KEY?.replaceAll("\\n", "\n") ?? "",
    {
      algorithm: "RS256",
    },
  );
}

export async function sendSlack(message: string, jwt: string) {
  return await fetch(process.env.SEND_SLACK_ENDPOINT ?? "", {
      method: "POST",
      body: JSON.stringify({ message: message }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "bearer " + jwt,
      },
    })
  .then((response) => response.json())
  .catch((error) =>
    console.log("Error sending Slack message: " + message + " - " + error),
    );
}

export async function createSalesforceContact(contact: {first_name: string, last_name: string, email: string, title: string}, jwt: string) {
    return await fetch(process.env.CREATE_SALESFORCE_CONTACT_ENDPOINT ?? "", {
        method: "POST",
        body: JSON.stringify(contact),
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error creating Salesforce contact: " + error)
        );
}

export async function createSalesforceOpportunity(opportunity: {opportunity_name: string, budget__c: string, authority__c: string, need__c: string, timing__c: string}, jwt: string) {
    return await fetch(process.env.PUT_SALESFORCE_OPPORTUNITY_ENDPOINT ?? "", {
        method: "POST",
        body: JSON.stringify(opportunity),
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error creating Salesforce opportunity: " + error)
        );
}

export async function createAsanaTask(task: {taskName: string, notes?: string, assignee?: string}, jwt: string) {
    return await fetch(process.env.CREATE_ASANA_TASK_ENDPOINT ?? "", {
        method: "POST",
        body: JSON.stringify(task),
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error creating Asana Task: " + error)
        );
}

export async function getAsanaTeam(jwt: string) {
    return await fetch(process.env.GET_ASANA_TEAM_ENDPOINT ?? "", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error getting Asana Team members: " + error)
        );
}
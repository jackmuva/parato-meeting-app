import {FunctionTool, OpenAIAgent, QueryEngineTool} from "llamaindex";
import {
    createAsanaTask,
    createSalesforceContact,
    createSalesforceOpportunity, getAsanaTeam,
    sendSlack,
    signJwt
} from "@/app/utility/request-utilities";
import {getDataSource} from "@/app/api/chat/engine/index";
import {generateFilters} from "@/app/api/chat/engine/queryFilter";

export async function createAgent(userId: string | (() => string), documentIds?: string[], params?: any): Promise<OpenAIAgent>{
    const summarizeTranscript = FunctionTool.from(
        ({ transcript}: { transcript: string; }) => {
            return "Transcript: " + transcript;
        },
        {
            name: "summarizeTranscript",
            description: "Use this function when a user asks for a meeting transcript to be summarized. " +
                "Based off the transcript present the option to draft a Salesforce Opportunity, send a Slack Message, " +
                "or create a task in Asana",
            parameters: {
                type: "object",
                properties: {
                    transcript: {
                        type: "string",
                        description: "Transcript of a meeting",
                    },
                },
                required: ["transcript"],
            },
        }
    );

    const draftSlackMessage = FunctionTool.from(
        ({ message}: { message: string; }) => {
            console.log("draft slack message: " + message);
            return "Message: " + message;
        },
        {
            name: "draftSlackMessage",
            description: "Use this function to draft a message in Slack. This is a required function step" +
                "before sending the message in Slack. Prompt confirmation from " +
                "user to trigger the confirm and send step. This function does not send the message in" +
                "Slack. This function only drafts a message and prompts for confirmation",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "The draft message",
                    },
                },
                required: ["message"],
            },
        }
    );


    const confirmAndSendSlackMessage = FunctionTool.from(
        async({ confirmation, message }: { confirmation: string; message: string; }) => {
            console.log("Confirmed: " + confirmation);
            console.log("Slack Message: " + message);

            const response = await sendSlack(message, signJwt(userId));
            if(response.status){
                return "Successfully Sent";
            }
            return "Message not sent successfully";
        },
        {
            name: "confirmAndSendSlackMessage",
            description: "Use this function to send a message in Slack only after a draft has been created. Do" +
                "not use this function if an affirmative confirmation is not given. Do not use this function if" +
                "a Slack message draft has not been created",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "The draft message",
                    },
                    confirmation: {
                        type: "string",
                        description: "affirmative confirmation to send draft message",
                    },
                },
                required: ["confirmation", "message"],
            },
        }
    );

    const draftSalesforceContact = FunctionTool.from(
        ({ first_name, last_name, email, title }: { first_name: string, last_name: string, email: string, title: string}) => {
            console.log("Saleforce Contact Draft:");
            console.log("Salesforce Contact first name: " + first_name);
            console.log("Salesforce Contact last name: " + last_name);
            console.log("Salesforce Contact email: " + email);
            console.log("Salesforce Contact title: " + title);
            return "Salesforce Contact first name: " + first_name + "\n" +
                "Salesforce Contact last name: " + last_name + "\n" +
                "Salesforce Contact email: " + email+ "\n" +
                "Salesforce Contact title: " + title;
        },
        {
            name: "draftSalesforceContact",
            description: "Use this function to draft a contact record in Salesforce. This is a required function step" +
                "before creating a contact record in Salesforce. Prompt confirmation from " +
                "user to trigger the Salesforce Contact record confirm and send step. This function does not create the Contact record" +
                "in Salesforce. This function only drafts a Contact record and prompts for confirmation",
            parameters: {
                type: "object",
                properties: {
                    first_name: {
                        type: "string",
                        description: "First name of Salesforce contact",
                    },
                    last_name: {
                        type: "string",
                        description: "Last name of Salesforce contact",
                    },
                    email: {
                        type: "string",
                        description: "Email of Salesforce contact",
                    },
                    title: {
                        type: "string",
                        description: "Title of Salesforce contact",
                    },
                },
                required: ["first_name", "last_name", "email", "title"],
            },
        }
    );

    const confirmAndCreateSalesforceContact = FunctionTool.from(
        async({ confirmation, first_name, last_name, email, title }: { confirmation: string, first_name: string, last_name: string,
            email: string, title: string}) => {
            console.log("Confirmed Salesforce Contact Creation: " + confirmation);
            const response = await createSalesforceContact({first_name, last_name, email, title}, signJwt(userId));
            console.log(response);
            if(response.status === '200'){
                return "Successfully created Salesforce Contact";
            }
            return response.error;
        },
        {
            name: "confirmAndCreateSalesforceContact",
            description: "Use this function to create a Salesforce Contact record only after a draft has been created. Do" +
                "not use this function if an affirmative confirmation is not given. Do not use this function if" +
                "a draft Salesforce Contact record has not been created",
            parameters: {
                type: "object",
                properties: {
                    confirmation: {
                        type: "string",
                        description: "affirmative confirmation to create Salesforce Contact record"
                    },
                    first_name: {
                        type: "string",
                        description: "First name of Salesforce contact",
                    },
                    last_name: {
                        type: "string",
                        description: "Last name of Salesforce contact",
                    },
                    email: {
                        type: "string",
                        description: "Email of Salesforce contact",
                    },
                    title: {
                        type: "string",
                        description: "Title of Salesforce contact",
                    },
                },
                required: ["confirmation", "first_name", "last_name", "email", "title"],
            },
        }
    );

    const draftSalesforceOpportunity = FunctionTool.from(
        ({opportunity_name, budget, authority, need, timing }: { confirmation: string, opportunity_name: string, budget: string, authority: string, need: string, timing: string}) => {
            console.log("Saleforce Opportunity Draft:");
            console.log("Salesforce Opportunity name: " + opportunity_name);
            console.log("Salesforce Opportunity budget: " + budget);
            console.log("Salesforce Opportunity authority: " + authority);
            console.log("Salesforce Opportunity need: " + need);
            console.log("Salesforce Opportunity timing: " + timing);
            return "Salesforce Opportunity name: " + opportunity_name +
                "Salesforce Opportunity budget: " + budget +
                "Salesforce Opportunity authority: " + authority +
                "Salesforce Opportunity need: " + need +
                "Salesforce Opportunity timing: " + timing;
        },
        {
            name: "draftSalesforceOpportunity",
            description: "Use this function to draft an opportunity record in Salesforce. This is a required function step" +
                "before creating an opportunity record in Salesforce. Prompt confirmation from " +
                "user to trigger the Salesforce Opportunity record confirm and send step. This function does not create the Opportunity record" +
                "in Salesforce. This function only drafts a Opportunity record and prompts for confirmation",
            parameters: {
                type: "object",
                properties: {
                    confirmation: {
                        type: "string",
                        description: "affirmative confirmation to create Salesforce Contact record"
                    },
                    opportunity_name: {
                        type: "string",
                        description: "Opportunity name of Salesforce Opportunity",
                    },
                    budget: {
                        type: "string",
                        description: "The party's budget",
                    },
                    authority: {
                        type: "string",
                        description: "Level of authority or decision making power this person has",
                    },
                    need: {
                        type: "string",
                        description: "How much a prospect needs our product",
                    },
                    timing: {
                        type: "string",
                        description: "Time to make a decision on purchasing"
                    }
                },
                required: ["confirmation", "opportunity_name", "budget", "authority", "need", "timing"],
            },
        }
    );

    const confirmAndCreateSalesforceOpportunity = FunctionTool.from(
        async({ confirmation, opportunity_name, budget__c, authority__c, need__c, timing__c }: { confirmation: string, opportunity_name: string, budget__c: string, authority__c: string, need__c: string, timing__c: string}) => {
            console.log("Confirmed Salesforce Opportunity Creation: " + confirmation);
            const response = await createSalesforceOpportunity({opportunity_name, budget__c, authority__c, need__c, timing__c}, signJwt(userId));
            console.log(response);
            if(response.status === '200' || response.status){
                return "Successfully created Salesforce Opportunity";
            }
            console.log("error");
            return response.error;
        },
        {
            name: "confirmAndCreateSalesforceOpportunity",
            description: "Use this function to create a Salesforce Opportunity record only after a draft has been created. Do" +
                "not use this function if an affirmative confirmation is not given. Do not use this function if" +
                "a draft Salesforce Opportunity record has not been created",
            parameters: {
                type: "object",
                properties: {
                    confirmation: {
                        type: "string",
                        description: "affirmative confirmation to create Salesforce Contact record"
                    },
                    opportunity_name: {
                        type: "string",
                        description: "Opportunity name of Salesforce Opportunity",
                    },
                    budget__c: {
                        type: "string",
                        description: "The party's budget",
                    },
                    authority__c: {
                        type: "string",
                        description: "Level of authority or decision making power this person has",
                    },
                    need__c: {
                        type: "string",
                        description: "What use case does the prospect need our productt for",
                    },
                    timing__c: {
                        type: "string",
                        description: "Time to make a decision on purchasing"
                    }
                },
                required: ["confirmation", "opportunity_name", "budget__c", "authority__c", "need__c", "timing__c"],
            },
        }
    );

    const draftAsanaTask = FunctionTool.from(
        async({ taskName, notes }: { taskName: string, notes: string }) => {
            console.log("Task Name: " + taskName);
            console.log("Task Notes: " + notes);
            const response = await getAsanaTeam(signJwt(userId));
            return response.members;
        },
        {
            name: "draftAsanaTask",
            description: "Use this function to draft a task in Asana. This is a required function step" +
                "before creating a task in Asana. Prompt user to assign a team member form their Asana team if assignee is not mentioned. " +
                "Get the ID of a team member before assigning it to an assignee." +
                "If user does not need an assignee or has assigned an assignee with their id, proceed to the confirm " +
                "and create Asana task step. " +
                "This function does not create the Asana task. " +
                "This function only drafts an Asana task and prompts for confirmation",
            parameters: {
                type: "object",
                properties: {
                    taskName: {
                        type: "string",
                        description: "The name of task",
                    },
                    notes: {
                        type: "string",
                        description: "Additional notes for the Asana task",
                    },
                    assignee:{
                        type: "string",
                        description: "The ID for the assignee of the Asana Task"
                    },
                },
                required: ["taskName"],
            },
        }
    );

    const getAsanaMemberId = FunctionTool.from(
        async({ name }: { name: string }) => {
            console.log("Getting Asana ID for: " + name);
            const response = await getAsanaTeam(signJwt(userId));
            console.log(response);
            for(const member of response.members){
                if(member.name === name){
                    return member.gid;
                }
            }
            return "Cannot be found";
        },
        {
            name: "getAsanaMemberId",
            description: "Use this function after a team member is assigned to an Asana task. This function gets the ID " +
                "of an Asana team member",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "The name of the team member",
                    }
                },
                required: ["name"],
            },
        }
    );


    const confirmAndCreateAsanaTask = FunctionTool.from(
        async({ confirmation, taskName, notes, assignee }: { confirmation: string; taskName: string; notes: string; assignee: string }) => {
            console.log("Asana Task Confirmed: " + confirmation);
            console.log("Notes: " + notes);
            console.log("assignee: " + assignee);

            const response = await createAsanaTask({taskName, notes, assignee}, signJwt(userId));
            if(response.status){
                return "Successfully Sent";
            }
            return "Message not sent successfully";
        },
        {
            name: "confirmAndCreateAsanaTask",
            description: "Use this function to create a task in Asana only after a draft for the task has been created. " +
                "If an assignee is provided, check to see if the assignee is an ID number. If the assignee is not an ID, get" +
                "the ID of the Asana team member. Do" +
                "not use this function if an affirmative confirmation is not given. Do not use this function if" +
                "an Asana task draft has not been created",
            parameters: {
                type: "object",
                properties: {
                    taskName: {
                        type: "string",
                        description: "The drafted name of task",
                    },
                    notes: {
                        type: "string",
                        description: "Additional notes on the drafted task"
                    },
                    assignee:{
                        type: "string",
                        description: "The ID for the assignee of the Asana Task"
                    },
                    confirmation: {
                        type: "string",
                        description: "affirmative confirmation to send draft message",
                    },
                },
                required: ["confirmation", "taskName"],
            },
        }
    );

    const index = await getDataSource(params);
    const permissionFilters = generateFilters(documentIds || []);
    const queryEngine = index.asQueryEngine({
            similarityTopK: process.env.TOP_K ? parseInt(process.env.TOP_K) : 3,
            preFilters: permissionFilters,
        });

    const queryEngineTool = new QueryEngineTool({
        queryEngine: queryEngine,
        metadata: {
            description: "query engine to pinecone database",
            name: "queryEngineTool"
        }
    });

    return new OpenAIAgent({
        tools: [summarizeTranscript,
            draftSlackMessage, confirmAndSendSlackMessage,
            draftSalesforceContact, confirmAndCreateSalesforceContact,
            draftSalesforceOpportunity, confirmAndCreateSalesforceOpportunity,
            draftAsanaTask, confirmAndCreateAsanaTask, getAsanaMemberId,
            queryEngineTool]
    });
}
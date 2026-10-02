// Strict provider contract: malformed free-form discovery must never stall the audit.
const text={type:'string'};
const optionalText={type:['string','null']};
const optionalNumber={type:['number','null']};
const list={type:'array',items:text};
function object(properties:Record<string,unknown>){return {type:'object',properties,required:Object.keys(properties),additionalProperties:false};}
export const modelTurnFormat={type:'json_schema',json_schema:{name:'opportunity_turn',strict:true,schema:object({
  reply:text,
  phase:{type:'string',enum:['warming','pain1','process','time_verify','pain2_probe','ready']},
  discovery:object({
    businessName:optionalText,businessType:optionalText,role:optionalText,teamSize:optionalText,
    pains:{type:'array',items:object({id:text,title:text,rawDescription:text,tools:list,processSteps:list,whoDoesIt:optionalText,whyItHurts:optionalText,
      time:object({label:text,minutesPerOccurrence:optionalNumber,occurrencesPerWeek:optionalNumber,hiddenMinutesPerOccurrence:optionalNumber,computedHoursPerWeek:optionalNumber,statedHoursPerWeek:optionalNumber,underestimationNote:optionalText}),
      automatable:{type:['boolean','null']},confidence:{type:'number'},
    })},activePainId:optionalText,seekingSecondPain:{type:'boolean'},notes:list,salesStage:optionalText,
  }),
})}};

export const handler = async (event) => {
    const { flag } = event.payload ? event.payload : event.payload.event;
     if (flag === 'new') {
         console.log("new")
         const { usecase_id,flag, project_id } = event.payload;
         const { stateName } = event;
         return {
             flag,
             usecase_id,
             project_id,
             stateName
         };
     } else if (flag === 'Update') {
         console.log("update")
         const { taskArray, flag,usecase_id,project_id } = event.payload;
         return {
             flag,
             taskArray,
             usecase_id,
             project_id,
         };
     }
 };
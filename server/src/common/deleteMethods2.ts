/* eslint-disable no-unused-vars */
import Study, { IStudy } from "../models/Study"
import Experiment, {IExperiment} from "../models/Experiment"
import Participant from "../models/Participant"
import User from "../models/User"
import mongoose from 'mongoose'

const deleteMethods = {
  /**
   * TODO: Test
   * Will remove all files from the given array of file ids.
   * Will call ```deleteFile``` function for each file. Just a controller function/wrapper.
   * @param {string} studyId
   * @param {string} experimentId
   * @param {string} participantId
   * @param {Array<string>} fileIds
   * @param {string} userId
   * @param {object} serverConfig the server config. Found in ```req.serverConfig```
   *
   * @return {Promise}
   */
  deleteFiles: async function (
    experimentId: string,
    participantId: string,
    fileIds: string[],
    userId: string,
    serverConfig: object
  ): Promise<{
    success: boolean
    error?: string
  }> {
    return await new Promise((resolve) => {
      const delResults: Array<Promise<{
        success: boolean
        error?: string
      }>> = []

      // delete all fileIds
      fileIds.forEach((fileId) => {
        delResults.push(
          this.deleteFile(experimentId, participantId, fileId, userId, serverConfig)
        )
      })

      // Once all file delete methods are done running, check to see if they were all successful
      Promise.all(delResults).then((results) => {
        let errorCheck = false

        results.forEach((result) => {
          if (!errorCheck && !result.success) {
            errorCheck = true
          }
        })

        // If we found error send back error message saying we couldn't delete all files
        if (errorCheck) {
          return resolve({
            success: false,
            error: "Unable to delete all files.",
          })
        } else {
          // successfully deleted all files
          return resolve({ success: true })
        }
      })
    })
  },

  /**
   * TODO: Test
   * Will remove a file from the given file id
   *
   * @param {string} fileId
   * @param {string} participantId
   * @param {string} fileId
   * @param {string} userId The user ID from authentication
   * @param {object} serverConfig the server config. Found in ```req.serverConfig```
   *
   * @return {Promise}
   */
  deleteFile: async function (
    experimentId: string,
    participantId: string,
    fileId: string,
    userId: string,
    serverConfig: any
  ): Promise<{ success: boolean; error?: string }> {
    return await new Promise((resolve) => {
      if (!experimentId) {
        return resolve({ success: false, error: "Experiment ID required." })
      }
      if (!participantId) {
        return resolve({ success: false, error: "Participant ID required" })
      }
      if (!fileId) {
        return resolve({ success: false, error: "File ID required" })
      }

      // all params present. Check that the Experiment exists
      Experiment.findOne({ _id: experimentId })
        .then((userExperiment) => {
          if (!userExperiment) {
            return resolve({ success: false, error: "Could not find Experiment." })
          }

          if (userExperiment.createdBy.toString() !== userId) {
            return resolve({
              success: false,
              error: "User does not own Experiment.",
            })
          }

          var id = new mongoose.Types.ObjectId(participantId);

          if (userExperiment.participants.indexOf(id) === -1) {
            return resolve({
              success: false,
              error: "Participant does not belong to this Experiment.",
            })
          }
        

          Participant.findOne({ _id: participantId })
            .then((foundParticipant) => {
              if (!foundParticipant) {
                return resolve({
                  success: false,
                  error: "Could not find participant.",
                })
              }

              const idxFound = foundParticipant.files.indexOf(fileId)
              if (idxFound === -1) {
                return resolve({
                  success: false,
                  error: "File does not belong to this Experiment.",
                })
              } else {
                // user owns Experiment, participant is in Experiment, file is in participant.
                // We can now delete the file and then remove from participant's file array.
                const foundFileId = foundParticipant.files[idxFound]

                // sent from the server.js file
                const mongoose = serverConfig.mongoose
                const db = serverConfig.db

                const conn = mongoose.createConnection(db)

                conn.once("open", function () {
                  const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db)

                  gridFSBucket.delete(foundFileId, function (err: any) {
                    if (!err) {
                      // file deleted succesfully, remove from the files array
                      Participant.updateOne(
                        { _id: participantId },
                        { $pull: { files: foundFileId } }
                      )
                        .then(() => {
                          return resolve({ success: true })
                        })
                        .catch((err) => {
                          return resolve({
                            success: false,
                            error: `Unable to update participant. ${err}`,
                          })
                        })
                    } else {
                      return resolve({
                        success: false,
                        error: "Error deleting file.",
                      })
                    }
                  })
                })
              }
            })
            .catch((err) => {
              return resolve({
                success: false,
                error: `Unable to get participant. ${err}`,
              })
            })
        })
        .catch((err) => {
          return resolve({
            success: false,
            error: `Unable to get Experiment. ${err}`,
          })
        })
    })
  },

  /**
   * Will remove a participant from a Experiment, and also delete the participant from the participants collection,
   * as well as all files associated with the participant...
   *
   * @param {string} experimentId
   * @param {string} participantIds
   * @param {string} ownerId id from the authentication token (req.user.id)
   * @param {object} serverConfig the server config. Found in ```req.serverConfig```
   */
  deleteParticipant: async function (
    experimentId: string,  
    participantId: string,
    ownerId: string,
    serverConfig: any
  ) {
    return await new Promise((resolve) => {
      // need a participant id before removing it from the Experiment.
      if (!participantId) {
        return resolve("Participant id is required.")
      }

      // need a Experiment id before removing it from the Experiment.
      if (!experimentId) {
        return resolve("Experiment id is required")
      }

      // get all files for a given participant, to then remove those files.
      Participant.findOne({ _id: participantId })
        .then((participant) => {
          if (!participant) {
            return resolve("Could not find participant")
          }

          const tempFiles = participant.files

          // Make sure we can find the Experiment, and the Experiment owner is doing this
          Experiment.findOne({ _id: experimentId })
            .then((Experiment) => {
              if (!Experiment) {
                return resolve("Could not find Experiment")
              }

              if (Experiment.createdBy.toString() === ownerId) {
                // Delete files for participant
                this.deleteFiles(
                  experimentId,
                  participantId,
                  tempFiles,
                  ownerId,
                  serverConfig
                ).then((filesRes) => {
                  if (filesRes.success) {
                    // Now delete participant from participant collection
                    Participant.deleteOne({ _id: participantId })
                      .then(() => {
                        Experiment.updateOne(
                          { _id: experimentId },
                          { $pull: { participants: participantId } }
                        )
                          .then(() => {
                            // console.log("Deleted participant successfully");
                            return resolve({ success: true })
                          })
                          .catch((err) => {
                            return resolve({
                              success: false,
                              error: `Could not remove user from Experiment: ${err}`,
                            })
                          })
                      })
                      .catch(() => {
                        return resolve({
                          success: false,
                          error: "Could not delete participant from collection",
                        })
                      })
                  } else {
                    return resolve({
                      success: false,
                      error: "Could not delete all files for participant",
                    })
                  }
                })
              } else {
                return resolve({
                  success: false,
                  error: "User does not own this Experiment",
                })
              }
            })
            .catch(() => {
              return resolve({
                success: false,
                error: "Could not find Experiment",
              })
            })
        })
        .catch((err) => {
          return resolve({
            success: false,
            error: `Could not find participant ${err}`,
          })
        })
    })
  },

  /**
   * This will delete a user's Experiment, including all participants, and their files.
   *
   * @param {string} experimentId
   * @param {string} userId
   * @param {object} serverConfig the server config. Found in ```req.serverConfig```
   *
   * @return {Promise}
   */
  deleteExperiment: async function (
    experimentId: string,
    userId: string,
    serverConfig: any
  ): Promise<{ success: boolean; error?: string }> {
    return await new Promise((resolve) => {
      if (!experimentId) {
        return resolve({ success: false, error: "No Experiment id received" })
      }

      // find the Experiment they want to delete.
      Experiment.findOne({ _id: experimentId }).then((userExperiment) => {
        if (!userExperiment) {
          return resolve({ success: false, error: "Could not find Experiment" })
        }

        // check that the user owns this Experiment
        if (userExperiment.createdBy.toString() !== userId) {
          return resolve({ success: false, error: "User does not own Experiment" })
        } else {
          const participants = userExperiment.participants
          const delMethodRetVal: Array<Promise<any>> = []

          // call the participants delete function for each participant.
          // It will also delete all files associated with each participant.
          participants.forEach((participant) => {
            let participantId = participant.toString()
            delMethodRetVal.push(
              deleteMethods.deleteParticipant(
                experimentId,
                participantId,
                userId,
                serverConfig
              )
            )
          })

          // Make sure all participants were successfully deleted. If not, say some weren't deleted
          Promise.all(delMethodRetVal).then((retArray) => {
            let errorFound = false
            retArray.forEach((delRetVal) => {
              if (!delRetVal.success) {
                errorFound = true
              }
            })

            // all participants, and their files, were deleted
            if (!errorFound) {
              // now delete the current Experiment
              Experiment.deleteOne({ _id: experimentId })
                .then(() => {
                  return resolve({ success: true })
                })
                .catch((err) => {
                  return resolve({
                    success: false,
                    error: `Unable to delete Experiment ${err}`,
                  })
                })
            } else {
              return resolve({
                success: false,
                error: "Unable to delete all participants. Did not delete Experiment",
              })
            }
          })
        }
      })
    })
  },

  /**
   * Will delete an array of Experiments given to it, and all data associated with it
   *
   * @param {Array<string>} Experiments an array of Experiments from the DB
   * @param {string} userId The user ID from authentication
   * @param {object} serverConfig the server config. Found in ```req.serverConfig```
   *
   * @returns {Promise}
   */
  deleteExperiments: async function (
    Experiments: IExperiment[],
    userId: string,
    serverConfig: any
  ): Promise<{ success: boolean; error?: string }> {
    return await new Promise((resolve) => {
      const results: Array<Promise<{ success: boolean; error?: string }>> = []

      Experiments.forEach((Experiment) => {
        results.push(this.deleteExperiment(Experiment._id, userId, serverConfig))
      })

      Promise.all(results).then((promisesDone) => {
        let errorCheck = false
        promisesDone.forEach((prms) => {
          if (!errorCheck && !prms.success) {
            errorCheck = true
          }
        })

        // Some error occurred, Couldn't delete everything
        if (errorCheck) {
          return resolve({
            success: false,
            error: "Could not delete all Experiments",
          })
        } else {
          // everyhing deleted fine. Send success message
          return resolve({ success: true })
        }
      })
    })
  },

  /** TODO: Later
   *
   * Will need to call ```deleteExperiments``` (wrapper) for all Experiments owned by this user.
   * This will in turn delete all participants, and files, associated with these Experiments.
   * Once all this is done, remove user from table, and delete is successful.
   *
   * @param {string} userId The user ID from authentication
   * @param {object} serverConfig the server config. Found in ```req.serverConfig```
   *
   * @returns {Promise}
   */
  deleteUser: async function (userId: string, serverConfig: any) {
    return await new Promise((resolve) => {
      if (!userId) {
        return resolve("No user ID found")
      }

      // This one shouldn't happen
      if (!serverConfig) {
        return resolve("No server config found...")
      }

      // TODO: Delete Study

      // get a list of Experiments owned by this user
      Experiment.find({ createdBy: userId })
        .then((Experiments) => {
          // now that we have list of Experiments, delete all of them and their related data
          this.deleteExperiments(Experiments, userId, serverConfig).then(
            (delExperimentsRes) => {
              if (delExperimentsRes.success) {
                // everything deleted, now delete user, then send back success/failure message
                User.deleteOne({ _id: userId })
                  .then((delUser) => {
                    if (delUser) {
                      return resolve({ success: true, delUser })
                    } else {
                      return resolve({
                        success: false,
                        error: "Could not delete user",
                      })
                    }
                  })
                  .catch((err) => {
                    return resolve({
                      success: false,
                      error: `Could not delete user. ${err}`,
                    })
                  })
              } else {
                return resolve("Could not delete all Experiments")
              }
            }
          )
        })
        .catch((err) => {
          return resolve({
            success: false,
            error: `Could not find Experiments to delete ${err}`,
          })
        })
    })
  },
}
export default deleteMethods
